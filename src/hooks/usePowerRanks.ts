import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { useActiveSeasonStandings } from '@/hooks/useLeagueData';
import { useTradeValues } from '@/hooks/useTradeValues';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useNflSchedule, emptySchedule } from '@/hooks/useNflSchedule';
import { bestLineup, simulateSeason, rosterRisks, observedWeeklySd, type SimTeam } from '@/lib/seasonSimulation';
export { bestLineup, simulateSeason } from '@/lib/seasonSimulation';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

export const NFL_WEEKS = 17;
export const REG_SEASON_WEEKS = 13;
export const SIMS = 3000;
export const SALARY_CEILING = 257;

const POS_CEILING_PPG: Record<string, number> = { QB: 20, RB: 17, WR: 16, TE: 12 };
const POS_FLOOR_PPG: Record<string, number> = { QB: 6, RB: 3, WR: 3, TE: 2 };

export const STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'FLEX', 'FLEX', 'FLEX', 'OP'];

const WEEKLY_POINTS = [20, 18, 16, 14, 8, 4, 3, 2, 1, 0];
const WEEKLY_SD = 24;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export const normalize = (n: string) =>
  n
    .toLowerCase()
    .replace(/[.'’`]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

export const toNum = (v?: string | null) => {
  if (!v) return 0;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

export const salaryImpliedPpg = (position: string, salary: number) => {
  const hi = POS_CEILING_PPG[position] ?? 15;
  const lo = POS_FLOOR_PPG[position] ?? 3;
  const pct = Math.min(1, Math.max(0, salary / SALARY_CEILING));
  return lo + (hi - lo) * Math.pow(pct, 0.75);
};

const eligible = (slot: string, pos: string) =>
  slot === 'OP' ? true : slot === 'FLEX' ? ['RB', 'WR', 'TE'].includes(pos) : slot === pos;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Asset = {
  id: string;
  name: string;
  position: string;
  ppg: number;
  basePpg?: number;
  projected: boolean;
  injuryStatus?: string;
  weeksOut?: number;
  out?: boolean;
  nflTeam?: string | null;
};

export const OUT_STATUSES = ['out', 'ir'];
export const INJURY_MULTIPLIER: Record<string, number> = {
  healthy: 1,
  questionable: 1,
  doubtful: 0.4,
  out: 0,
  ir: 0,
};

export type Odds = { top2: number; top4: number; top5: number; champ: number };

export type PowerRankRow = {
  team: {
    id: string;
    name: string;
    owner: string;
    totalPoints: number;
    avgPPW: number;
  };
  roster: Asset[];
  starters: Asset[];
  injured: Asset[];
  starterPpw: number;
  lineupPpw?: number | null;
  retained: number;
  replacementPpg: number;
  benchCount: number;
  score: number;
  rawScore?: number;
  odds: Odds;
  weeksPlayed: number;
  startN: number;
  depthN: number;
  standN: number;
  risks?: ReturnType<typeof rosterRisks>;
  weeklySd?: number;
};

/* ------------------------------------------------------------------ */
/* Lineup + depth                                                     */
/* ------------------------------------------------------------------ */

const lineupTotal = (roster: Asset[], excluded?: Set<string>) =>
  bestLineup(roster, excluded).reduce((s, p) => s + p.ppg, 0);

export const depthResilience = (roster: Asset[]) => {
  const base = lineupTotal(roster);
  const starters = bestLineup(roster);
  if (!starters.length || base <= 0) return { retained: 0, replacementPpg: 0 };
  let sum = 0;
  for (const s of starters) {
    sum += lineupTotal(roster, new Set([s.id]));
  }
  const avgWithInjury = sum / starters.length;
  return {
    retained: avgWithInjury / base,
    replacementPpg: avgWithInjury / STARTER_SLOTS.length,
  };
};

/* ------------------------------------------------------------------ */
/* Season simulation                                                  */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePowerRankRows() {
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const { data: standings = [], isLoading: standingsLoading } = useActiveSeasonStandings();
  const { byId: tvById } = useTradeValues();
  const { data: weeklyScores = [] } = useWeeklyScores();
  const { data: schedule = emptySchedule, isLoading: scheduleLoading, isError: scheduleError } = useNflSchedule();
  const [proj, setProj] = useState<Record<string, number>>({});
  const [projLoaded, setProjLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const text = await (await fetch('/data/projections-2026.csv')).text();
        const map: Record<string, number> = {};
        text
          .split(/\r?\n/)
          .slice(1)
          .filter(Boolean)
          .forEach((line) => {
            const cells = line.split(',');
            if (cells.length < 3) return;
            const name = normalize(cells[0].replace(/"/g, ''));
            const fpts = parseFloat(cells[2]);
            if (!name || isNaN(fpts)) return;
            map[name] = fpts / NFL_WEEKS;
          });
        setProj(map);
      } catch {
        setProj({});
      } finally {
        setProjLoaded(true);
      }
    })();
  }, []);

  const input = useMemo(() => {
    if (!standings.length) return { weeksPlayed: 0, list: [] as { team: (typeof standings)[number]; roster: Asset[] }[] };

    const byTeam = new Map<string, PlayerSalaryWithDetails[]>();
    salaries.forEach((s) => {
      if (!s.teamId || s.practiceSquad) return;
      const list = byTeam.get(s.teamId) ?? [];
      list.push(s);
      byTeam.set(s.teamId, list);
    });

    const weeksPlayed = Math.max(
      0,
      Math.round(
        Math.max(
          ...standings.map((t) => (t.avgPPW > 0 ? t.pointsFor / t.avgPPW : 0)),
          0
        )
      )
    );

    return {
      weeksPlayed,
      list: standings.map((team) => {
      const seen = new Set<string>();
      const roster: Asset[] = (byTeam.get(team.id) ?? [])
        .filter((s) => {
          const key = normalize(`${s.firstName} ${s.lastName}`);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((s) => {
          const name = `${s.firstName} ${s.lastName}`;
          const projected = proj[normalize(name)];
          const salary = Math.max(
            toNum(s.salary2027),
            s.franchiseTag ? 100 : 0
          );
          const status = s.injuryStatus ?? 'healthy';
          const weeksOut = s.injuryWeeksOut ?? 0;
          const isOut = OUT_STATUSES.includes(status);
          const baseline = projected ?? s.espnProjPpg ?? salaryImpliedPpg(s.position, salary);
          // Current production leads, but a short hot/cold run is shrunk toward expectations.
          const performanceWeight = s.actualPpg != null && s.gamesPlayed > 0 ? Math.min(0.8, s.gamesPlayed / (s.gamesPlayed + 3)) : 0;
          const raw = baseline * (1 - performanceWeight) + (s.actualPpg ?? baseline) * performanceWeight;
          return {
            id: s.id,
            name,
            position: s.position,
            ppg: raw * (INJURY_MULTIPLIER[status] ?? 1),
            basePpg: raw,
            projected: projected != null,
            injuryStatus: status,
            weeksOut,
            out: isOut,
            nflTeam: s.nflTeam ?? null,
          };
        });
      return { team, roster };
      }),
    };
  }, [salaries, standings, proj]);

  const compute = useCallback((list: { team: (typeof standings)[number]; roster: Asset[] }[], weeksPlayed: number, realPpw: Record<string, number>, tvOf: (id: string) => number | undefined) => {
    if (!list.length) return [];
    const base = list.map(({ team, roster }) => {
      const available = roster.filter((p) => !p.out);
      const injured = roster.filter((p) => p.out);
      const starters = bestLineup(available);
      const starterPpw = starters.reduce((s, p) => s + p.ppg, 0);
      const { retained, replacementPpg } = depthResilience(available);

      return {
        team: {
          id: team.id,
          name: team.name,
          owner: team.owner,
          totalPoints: team.totalPoints,
          avgPPW: team.avgPPW,
        },
        roster,
        starters,
        injured,
        starterPpw,
        retained,
        replacementPpg,
        benchCount: Math.max(0, available.length - starters.length),
        realPpw: realPpw[team.id] ?? starterPpw,
        benchTv: (() => {
          const ids = new Set(starters.map((p) => p.id));
          const vals = roster.filter((p) => !ids.has(p.id)).map((p) => tvOf(p.id)).filter((v): v is number => v != null);
          return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : 0;
        })(),
      };
    });

    const span = (vals: number[]) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return (v: number) => (max - min < 0.0001 ? 0.5 : (v - min) / (max - min));
    };

    const nStart = span(base.map((b) => b.starterPpw));
    const nDepth = span(base.map((b) => b.replacementPpg));
    const nStand = span(base.map((b) => b.team.totalPoints));

    // Standings weight ramps every week: 30% after Week 1 → 75% by Week 13
    const rampProgress = Math.min(1, Math.max(0, (weeksPlayed - 1) / (REG_SEASON_WEEKS - 1)));
    const wStand = weeksPlayed === 0 ? 0 : 0.3 + 0.45 * rampProgress;
    // Non-standings share: projected lineup 34%, real Starter PPW 28%, depth 18%, bench trade value 20%
    const wStart = (1 - wStand) * 0.34;
    const wReal = (1 - wStand) * 0.28;
    const wDepth = (1 - wStand) * 0.18;
    const wBench = (1 - wStand) * 0.2;
    const nReal = span(base.map((b) => b.realPpw));
    const nBench = span(base.map((b) => b.benchTv));

    const scored = base.map((b) => {
      const startN = nStart(b.starterPpw);
      const depthN = nDepth(b.replacementPpg);
      const standN = nStand(b.team.totalPoints);
      const raw =
        startN * wStart + nReal(b.realPpw) * wReal + depthN * wDepth + nBench(b.benchTv) * wBench + standN * wStand;
      return {
        ...b,
        startN,
        depthN,
        standN,
        score: Math.round(12 + raw * 88),
        rawScore: 12 + raw * 88,
      };
    });

    const simTeams: SimTeam[] = scored.map((b) => {
      const healthy = b.roster.map(p => ({ ...p, ppg: p.basePpg ?? p.ppg }));
      const rosterPpw = bestLineup(healthy).reduce((s, p) => s + p.ppg, 0);
      // Historical TEAM totals are a modest calibration, not the forecast itself.
      // Current-lineup actual averages and player histories already inform the roster model.
      const historyWeight = Math.min(0.2, weeksPlayed / 40);
      return {
        id: b.team.id,
        meanPpw: rosterPpw * (1 - historyWeight) + b.team.avgPPW * historyWeight,
        accumulated: b.team.totalPoints,
        roster: b.roster,
        weeklySd: observedWeeklySd(weeklyScores.filter(s => s.teamId === b.team.id && s.week <= weeksPlayed).map(s => s.score)),
      };
    });
    const odds = simulateSeason(simTeams, weeksPlayed, schedule);

    return scored
      .map((b) => ({ ...b, odds: odds[b.team.id], weeksPlayed, risks: rosterRisks(b.roster, weeksPlayed + 1, schedule), weeklySd: simTeams.find(t => t.id === b.team.id)?.weeklySd }))
      .sort((a, b) => b.score - a.score || b.starterPpw - a.starterPpw);
  }, [schedule, weeklyScores]);

  const tvOf = useCallback((id: string) => tvById.get(id)?.value, [tvById]);

  // Current ESPN starting lineup's season average (slots 20 = bench, 21 = IR).
  const lineupPpw = useMemo(() => {
    const m: Record<string, number> = {};
    salaries.forEach((s) => {
      if (!s.teamId || s.practiceSquad || s.espnLineupSlot == null || s.espnLineupSlot === 20 || s.espnLineupSlot === 21) return;
      m[s.teamId] = (m[s.teamId] ?? 0) + (s.actualPpg ?? 0);
    });
    return m;
  }, [salaries]);

  const rows = useMemo(
    () => compute(input.list, input.weeksPlayed, lineupPpw, tvOf).map((r) => ({ ...r, lineupPpw: lineupPpw[r.team.id] ?? null })),
    [compute, input, lineupPpw, tvOf]
  );

  /** Re-run Power Ranks with one team's roster changed (drop ids, add assets). */
  const whatIf = useCallback(
    (teamId: string, dropIds: Set<string>, adds: Asset[]) => {
      const list = input.list.map((t) =>
        t.team.id === teamId ? { ...t, roster: [...t.roster.filter((p) => !dropIds.has(p.id)), ...adds] } : t
      );
      const sum = (r: Asset[]) => bestLineup(r.filter((p) => !p.out)).reduce((a, p) => a + p.ppg, 0);
      const before = input.list.find((t) => t.team.id === teamId);
      const after = list.find((t) => t.team.id === teamId);
      const real = { ...lineupPpw };
      if (before && after && real[teamId] != null) real[teamId] += sum(after.roster) - sum(before.roster);
      return compute(list, input.weeksPlayed, real, tvOf);
    },
    [compute, input, lineupPpw, tvOf]
  );

  const loading = salariesLoading || standingsLoading || !projLoaded || scheduleLoading;

  return { rows, loading, weeksPlayed: rows[0]?.weeksPlayed ?? 0, whatIf, proj, scheduleError, schedule };
}
