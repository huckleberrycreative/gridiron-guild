import { useEffect, useMemo, useState } from 'react';
import { usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { useActiveSeasonStandings } from '@/hooks/useLeagueData';

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

const WEEKLY_POINTS = [20, 18, 16, 14, 12, 5, 4, 3, 2, 1];
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
  projected: boolean;
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
  starterPpw: number;
  retained: number;
  replacementPpg: number;
  benchCount: number;
  score: number;
  odds: Odds;
  weeksPlayed: number;
  startN: number;
  depthN: number;
  standN: number;
};

/* ------------------------------------------------------------------ */
/* Lineup + depth                                                     */
/* ------------------------------------------------------------------ */

export const bestLineup = (roster: Asset[], excluded = new Set<string>()) => {
  const pool = [...roster]
    .filter((p) => !excluded.has(p.id))
    .sort((a, b) => b.ppg - a.ppg);
  const used = new Set<string>();
  const lineup: Asset[] = [];
  for (const slot of STARTER_SLOTS) {
    const pick = pool.find((p) => !used.has(p.id) && eligible(slot, p.position));
    if (pick) {
      used.add(pick.id);
      lineup.push(pick);
    }
  }
  return lineup;
};

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

type SimTeam = {
  id: string;
  meanPpw: number;
  accumulated: number;
};

// Box-Muller
let spare: number | null = null;
const gauss = () => {
  if (spare != null) {
    const v = spare;
    spare = null;
    return v;
  }
  let u = 0;
  let v = 0;
  let s = 0;
  do {
    u = Math.random() * 2 - 1;
    v = Math.random() * 2 - 1;
    s = u * u + v * v;
  } while (s === 0 || s >= 1);
  const mul = Math.sqrt((-2 * Math.log(s)) / s);
  spare = v * mul;
  return u * mul;
};

export const simulateSeason = (teams: SimTeam[], weeksPlayed: number): Record<string, Odds> => {
  const n = teams.length;
  const counts: Record<string, Odds> = {};
  teams.forEach((t) => (counts[t.id] = { top2: 0, top4: 0, top5: 0, champ: 0 }));
  const weeksLeft = Math.max(0, REG_SEASON_WEEKS - weeksPlayed);

  for (let sim = 0; sim < SIMS; sim++) {
    const totals = teams.map((t) => t.accumulated);

    for (let w = 0; w < weeksLeft; w++) {
      const scores = teams.map((t, i) => ({ i, s: t.meanPpw + gauss() * WEEKLY_SD }));
      scores.sort((a, b) => b.s - a.s);
      scores.forEach((row, place) => {
        totals[row.i] += WEEKLY_POINTS[place] ?? 0;
      });
    }

    const order = totals
      .map((v, i) => ({ i, v: v + Math.random() * 0.01 }))
      .sort((a, b) => b.v - a.v);

    order.forEach((row, seedIdx) => {
      const id = teams[row.i].id;
      if (seedIdx < 2) counts[id].top2++;
      if (seedIdx < 4) counts[id].top4++;
      if (seedIdx < 5) counts[id].top5++;
    });

    // Playoffs: weeks 14 & 15 semifinal per the Constitution
    const field = order.slice(0, 5).map((row, seedIdx) => {
      const t = teams[row.i];
      const a = t.meanPpw + gauss() * WEEKLY_SD;
      const b = t.meanPpw + gauss() * WEEKLY_SD;
      const semi =
        seedIdx < 2 ? Math.max(a, b) : seedIdx < 4 ? (a + b) / 2 : Math.min(a, b);
      return { t, semi };
    });
    field.sort((a, b) => b.semi - a.semi);
    const finalists = field.slice(0, 2);
    const f0 = finalists[0].t.meanPpw * 2 + gauss() * WEEKLY_SD * Math.SQRT2;
    const f1 = finalists[1].t.meanPpw * 2 + gauss() * WEEKLY_SD * Math.SQRT2;
    counts[f0 >= f1 ? finalists[0].t.id : finalists[1].t.id].champ++;
  }

  const out: Record<string, Odds> = {};
  Object.entries(counts).forEach(([id, c]) => {
    out[id] = {
      top2: (c.top2 / SIMS) * 100,
      top4: (c.top4 / SIMS) * 100,
      top5: (c.top5 / SIMS) * 100,
      champ: (c.champ / SIMS) * 100,
    };
  });
  return out;
};

/* ------------------------------------------------------------------ */
/* Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePowerRankRows() {
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const { data: standings = [], isLoading: standingsLoading } = useActiveSeasonStandings();
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

  const rows = useMemo(() => {
    if (!standings.length) return [];

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

    const base = standings.map((team) => {
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
            toNum(s.salary2026),
            toNum(s.salary2027),
            s.franchiseTag ? 100 : 0
          );
          return {
            id: s.id,
            name,
            position: s.position,
            ppg: projected ?? salaryImpliedPpg(s.position, salary),
            projected: projected != null,
          };
        });

      const starters = bestLineup(roster);
      const starterPpw = starters.reduce((s, p) => s + p.ppg, 0);
      const { retained, replacementPpg } = depthResilience(roster);

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
        starterPpw,
        retained,
        replacementPpg,
        benchCount: Math.max(0, roster.length - starters.length),
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

    const seasonProgress = Math.min(1, weeksPlayed / REG_SEASON_WEEKS);
    const wStand = 0.4 * seasonProgress;
    const wStart = (1 - wStand) * 0.68;
    const wDepth = (1 - wStand) * 0.32;

    const scored = base.map((b) => {
      const startN = nStart(b.starterPpw);
      const depthN = nDepth(b.replacementPpg);
      const standN = nStand(b.team.totalPoints);
      const raw = startN * wStart + depthN * wDepth + standN * wStand;
      return {
        ...b,
        startN,
        depthN,
        standN,
        score: Math.round(12 + raw * 88),
      };
    });

    const projMean = scored.reduce((s, b) => s + b.starterPpw, 0) / scored.length;
    const simTeams: SimTeam[] = scored.map((b) => {
      const actual = b.team.avgPPW;
      const blend =
        weeksPlayed > 0
          ? (b.starterPpw * (REG_SEASON_WEEKS - Math.min(weeksPlayed, REG_SEASON_WEEKS)) +
              actual * Math.min(weeksPlayed, REG_SEASON_WEEKS)) /
            REG_SEASON_WEEKS
          : b.starterPpw;
      const injuryDrag = (1 - b.retained) * 0.55;
      return {
        id: b.team.id,
        meanPpw: Math.max(40, blend * (1 - injuryDrag)),
        accumulated: b.team.totalPoints,
      };
    });
    void projMean;

    const odds = simulateSeason(simTeams, weeksPlayed);

    return scored
      .map((b) => ({ ...b, odds: odds[b.team.id], weeksPlayed }))
      .sort((a, b) => b.score - a.score || b.starterPpw - a.starterPpw);
  }, [salaries, standings, proj]);

  const loading = salariesLoading || standingsLoading || !projLoaded;

  return { rows, loading, weeksPlayed: rows[0]?.weeksPlayed ?? 0 };
}
