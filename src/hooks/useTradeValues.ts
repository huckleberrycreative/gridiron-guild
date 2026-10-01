import { useEffect, useMemo, useState } from 'react';
import { usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { normalize, toNum, NFL_WEEKS } from '@/hooks/usePowerRanks';

const POS_MAX: Record<string, number> = { QB: 180, RB: 257, WR: 203, TE: 167 };

export const parseCsv = (text: string) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) => (line.match(/("([^"]*)"|[^,]*)(,|$)/g) || []).map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').trim()));

type Rank = { overall: number; posRank: number; age?: number };
const loadRanks = async (url: string, nameCol: number, posCol: number, ageCol?: number) => {
  const rows = parseCsv(await (await fetch(url)).text()).slice(1);
  const map = new Map<string, Rank>();
  rows.forEach((r) => {
    const name = r[nameCol];
    if (!name) return;
    const age = ageCol != null ? toNum(r[ageCol]) : 0;
    map.set(normalize(name), { overall: toNum(r[0]), posRank: toNum(r[posCol]?.replace(/^[A-Z]+/, '')), age: age || undefined });
  });
  return map;
};

// 1st overall ≈ 100, ~400th ≈ 0, log-scaled so the elite tier separates
// Power curve: elite ranks still separate, but a mid-tier starter (e.g. #84 overall)
// scores ~64 instead of being crushed to ~27 by a log curve.
const rankScore = (rank: number, depth = 400) =>
  rank > 0 ? Math.max(0, 100 * (1 - Math.pow((rank - 1) / (depth - 1), 0.5))) : 0;

export type TradeValueRow = {
  id: string;
  name: string;
  position: string;
  team: string;
  ppg: number;
  vor: number | null;
  actual: number | null;
  rosRank: number | null;
  dynastyRank: number | null;
  talent: number;
  salary: number;
  avgCost: number;
  surplus: number;
  value: number;
};

/** Shared Trade Value Chart model — used by the chart and the Trade Analyzer. */
export function useTradeValues(extra?: PlayerSalaryWithDetails[]) {
  const { data: dbPlayers = [], isLoading } = usePlayerSalaries();
  const players = useMemo(() => {
    if (!extra?.length) return dbPlayers;
    const known = new Set(dbPlayers.map((p) => normalize(`${p.firstName} ${p.lastName}`.trim())));
    return [...dbPlayers, ...extra.filter((p) => !known.has(normalize(`${p.firstName} ${p.lastName}`.trim())))];
  }, [dbPlayers, extra]);
  const [ranks, setRanks] = useState<{
    dyn: Map<string, Rank>;
    rook: Map<string, Rank>;
    ros: Map<string, Rank>;
    proj: Map<string, number>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [dyn, rook, ros, projText] = await Promise.all([
        loadRanks('/data/dynasty-2026.csv', 2, 4, 5),
        loadRanks('/data/rookies-2026.csv', 2, 4, 5),
        loadRanks('/data/ros-2026.csv', 1, 3),
        fetch('/data/projections-2026.csv').then((r) => r.text()),
      ]);
      const proj = new Map<string, number>();
      parseCsv(projText).slice(1).forEach((r) => r[0] && proj.set(normalize(r[0]), parseFloat(r[2]) / NFL_WEEKS));
      setRanks({ dyn, rook, ros, proj });
    })();
  }, []);

  const rows = useMemo(() => {
    if (!ranks) return [];
    // Replacement level: average projected PPG of rostered players at each position
    const posTotals: Record<string, { sum: number; n: number }> = {};
    players.forEach((p) => {
      if (!POS_MAX[p.position] || !p.teamId) return;
      const v = ranks.proj.get(normalize(`${p.firstName} ${p.lastName}`.trim())) ?? 0;
      if (v <= 0) return;
      posTotals[p.position] ??= { sum: 0, n: 0 };
      posTotals[p.position].sum += v;
      posTotals[p.position].n += 1;
    });
    const posAvg = (pos: string) => {
      const t = posTotals[pos];
      return t && t.n ? t.sum / t.n : 10;
    };
    const raw = players
      .filter((p) => POS_MAX[p.position])
      .map((p) => {
        const name = `${p.firstName} ${p.lastName}`.trim();
        const key = normalize(name);
        const dyn = ranks.dyn.get(key);
        const rook = ranks.rook.get(key);
        const ros = ranks.ros.get(key);
        // PPG anchored to the preseason projection (which reflects multi-year history),
        // blended with actual 2026 output. Established veterans (age 25+, not rookies)
        // lean heavily on their track record: a hot or cold 3 weeks moves them only a
        // little. Young players (rookies / age ≤ 24) get credit for hot starts quickly
        // so risers aren't punished. Everyone converges to real output over the season.
        const age = dyn?.age ?? rook?.age;
        const young = !!rook || (age != null && age <= 24);
        const pre = ranks.proj.get(key);
        const espn = p.espnProjPpg && p.espnProjPpg > 0 ? p.espnProjPpg : undefined;
        const base = pre && espn ? pre * 0.7 + espn * 0.3 : pre ?? espn ?? 0;
        const g = p.gamesPlayed || 0;
        const hasActual = p.actualPpg != null && g > 0;
        const actual = hasActual ? (p.actualPpg as number) : base;
        const wUp = g / (g + (rook ? 2 : young ? 4 : 10));
        const wDown = g / (g + (young ? 8 : 12));
        const ppg = hasActual
          ? base + Math.max(0, actual - base) * wUp - Math.max(0, base - actual) * wDown
          : base;
        // Young players outplaying their projection also get a future-growth bump
        const rookieBump = young && hasActual ? Math.max(0, Math.min(15, (actual - base) * 3 * wUp * 2)) : 0;
        // Age / longevity: value fades past each position's prime (floor 45%)
        const PRIME: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };
        const agePenalty = age && age > PRIME[p.position] ? (age - PRIME[p.position]) * (p.position === 'RB' ? 0.09 : 0.08) : 0;
        const ageMult = Math.max(0.45, 1 - agePenalty);

        // Future value: dynasty rank; unlisted rookies approximated from rookie rank
        const dynastyRank = dyn?.overall ?? (rook ? 20 + rook.overall * 4 : null);
        const dynScore = Math.min(100, (dynastyRank ? rankScore(dynastyRank, 450) : 0) + rookieBump);
        // Present value: rest-of-season rank, blended with projected PPG
        const rosScore = ros ? rankScore(ros.overall, 400) : 0;
        const ppgScore = Math.min(100, (ppg / 22) * 100);
        const now = ros ? rosScore * 0.7 + ppgScore * 0.3 : ppgScore * 0.8;
        // Value over replacement: % above the league average at the position
        const avg = posAvg(p.position);
        const vorPct = ppg > 0 ? (ppg - avg) / avg : -0.5;
        const vorScore = Math.max(0, Math.min(100, 50 + vorPct * 60));
        const talent = dynScore * 0.45 + now * 0.25 + vorScore * 0.3;

        // Cost: weighted average of next three contract years.
        // 2027 dominates (62.5%) since everyone shares the same progression;
        // 2028 is 25%, 2029 is 12.5%. Missing years redistribute to present ones.
        const s27 = toNum(p.salary2027);
        const s28 = toNum(p.salary2028);
        const s29 = toNum(p.salary2029);
        const fallback = toNum(p.salary2026) || 1;
        const parts: [number, number][] = [
          [s27, 0.625],
          [s28, 0.25],
          [s29, 0.125],
        ].filter(([n]) => n > 0) as [number, number][];
        const wSum = parts.reduce((a, [, w]) => a + w, 0);
        const avgCost = parts.length
          ? parts.reduce((a, [n, w]) => a + n * w, 0) / wSum
          : fallback;

        return {
          id: p.id,
          name,
          position: p.position,
          team: p.fantasyTeam,
          ppg,
          actual: hasActual ? (p.actualPpg as number) : null,
          vor: ppg > 0 ? ppg - avg : null,
          rosRank: ros?.overall ?? null,
          dynastyRank: dyn?.overall ?? null,
          talent,
          dynScore,
          salary: toNum(p.salary2027) || fallback,
          s27: s27 || fallback,
          s28: s28 || s27 || fallback,
          s29: s29 || s28 || s27 || fallback,
          practiceSquad: p.practiceSquad,
          avgCost,
          ft: p.franchiseTag,
          ageMult,
          age: age ?? null,
          teamId: p.teamId,
        };
      });

    // ---- Salary-cap surplus model, evaluated WITHIN each roster group ----
    // Groups: QB, RB, and Pass Catchers (WR + TE on one spectrum). Every group is
    // scaled on its own so the best player in each group is ~100.
    const grp = (p: string) => (p === 'WR' || p === 'TE' ? 'PC' : p);
    const GROUPS = ['QB', 'RB', 'PC'];
    const rostered = raw.filter((r) => r.teamId);
    const repl: Record<string, number> = {};
    const dpp: Record<string, number> = {};
    const gTop: Record<string, number> = {};
    GROUPS.forEach((g) => {
      const members = rostered.filter((r) => grp(r.position) === g);
      const v = members.filter((r) => r.ppg > 0).map((r) => r.ppg).sort((a, b) => a - b);
      repl[g] = v.length ? v[Math.floor(v.length * 0.25)] : 5;
      const spent = members.reduce((a, r) => a + Math.max(0, r.avgCost - 1), 0);
      const pts = members.reduce((a, r) => a + Math.max(0, r.ppg - repl[g]), 0);
      dpp[g] = pts > 0 ? spent / pts : 20;
      const desc = [...v].reverse();
      gTop[g] = desc[Math.min(2, desc.length - 1)] || 1;
    });
    const withSurplus = raw.map((r) => {
      const g = grp(r.position);
      const over = Math.max(0, r.ppg - repl[g]);
      return { ...r, group: g, surplus: over * dpp[g] - r.avgCost };
    });
    const sRange: Record<string, [number, number]> = {};
    GROUPS.forEach((g) => {
      const s = withSurplus.filter((r) => r.teamId && r.group === g).map((r) => r.surplus);
      sRange[g] = [Math.min(0, ...s), Math.max(1, ...s)];
    });
    const withRaw = withSurplus.map((r) => {
      const [sMin, sMax] = sRange[r.group];
      const surplusScore = Math.max(0, ((r.surplus - sMin) / (sMax - sMin)) * 100);
      const prodScore = Math.min(100, (r.ppg / gTop[r.group]) * 100);
      const score = surplusScore * 0.65 + r.dynScore * 0.2 + prodScore * 0.15;
      return { ...r, raw: score * r.ageMult };
    });
    const bounds: Record<string, [number, number]> = {};
    GROUPS.forEach((g) => {
      const v = withRaw.filter((r) => r.teamId && r.group === g).map((r) => r.raw);
      // Anchor the top of each group to the average of its top 3 so one outlier
      // doesn't compress everyone else; the #1 still caps at 100.
      const d = [...v].sort((a, b) => b - a);
      const top3 = d.slice(0, 3);
      const anchor = top3.length ? top3.reduce((a, b) => a + b, 0) / top3.length : 1;
      bounds[g] = [v.length ? Math.min(...v) : 0, Math.max(1, anchor)];
    });
    return withRaw
      .map((r) => {
        const [bottom, top] = bounds[r.group];
        const baseValue = Math.max(0, Math.min(100, Math.round(Math.pow(Math.max(0, r.raw - bottom * 0.5) / (top - bottom * 0.5), 0.6) * 100)));
        return {
          ...r,
          value: r.ft ? Math.max(0, baseValue - 5) : baseValue,
          talent: Math.round(r.talent),
          surplus: Math.round(r.surplus),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [players, ranks]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const byName = useMemo(() => new Map(rows.map((r) => [normalize(r.name), r])), [rows]);
  return { rows, byId, byName, isLoading: isLoading || !ranks };
}
