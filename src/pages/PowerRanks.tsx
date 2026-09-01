import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { usePlayerSalaries, type PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { useActiveSeasonStandings } from '@/hooks/useLeagueData';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, Shield, Activity } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Projections                                                         */
/* ------------------------------------------------------------------ */

const NFL_WEEKS = 17;
const REG_SEASON_WEEKS = 13;

const normalize = (n: string) =>
  n
    .toLowerCase()
    .replace(/[.'’`]/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

// Salary-implied fallback when a player has no public projection
const SALARY_CEILING = 257;
const POS_CEILING_PPG: Record<string, number> = { QB: 20, RB: 17, WR: 16, TE: 12 };
const POS_FLOOR_PPG: Record<string, number> = { QB: 6, RB: 3, WR: 3, TE: 2 };

const toNum = (v?: string | null) => {
  if (!v) return 0;
  const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const salaryImpliedPpg = (position: string, salary: number) => {
  const hi = POS_CEILING_PPG[position] ?? 15;
  const lo = POS_FLOOR_PPG[position] ?? 3;
  const pct = Math.min(1, Math.max(0, salary / SALARY_CEILING));
  return lo + (hi - lo) * Math.pow(pct, 0.75);
};

/* ------------------------------------------------------------------ */
/* Lineup + depth                                                      */
/* ------------------------------------------------------------------ */

type Asset = {
  id: string;
  name: string;
  position: string;
  ppg: number;
  projected: boolean;
};

const STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'FLEX', 'FLEX', 'FLEX', 'OP'];
const eligible = (slot: string, pos: string) =>
  slot === 'OP' ? true : slot === 'FLEX' ? ['RB', 'WR', 'TE'].includes(pos) : slot === pos;

const bestLineup = (roster: Asset[], excluded = new Set<string>()) => {
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

/**
 * Injury-adjusted depth: how much weekly output survives when a team loses
 * each of its starters in turn. Averaged across every starter, this is the
 * true "replacement" quality of the bench.
 */
const depthResilience = (roster: Asset[]) => {
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
/* Season simulation                                                   */
/* ------------------------------------------------------------------ */

const WEEKLY_POINTS = [20, 18, 16, 14, 12, 5, 4, 3, 2, 1];
const WEEKLY_SD = 24; // week-to-week volatility of a fantasy lineup
const SIMS = 3000;

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

type SimTeam = {
  id: string;
  meanPpw: number;
  accumulated: number;
};

type Odds = { top2: number; top4: number; top5: number; champ: number };

const simulateSeason = (teams: SimTeam[], weeksPlayed: number): Record<string, Odds> => {
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
    const f0 =
      finalists[0].t.meanPpw * 2 + gauss() * WEEKLY_SD * Math.SQRT2;
    const f1 =
      finalists[1].t.meanPpw * 2 + gauss() * WEEKLY_SD * Math.SQRT2;
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
/* Page                                                                */
/* ------------------------------------------------------------------ */

const pct = (v: number) => (v >= 99.5 ? '>99%' : v < 0.5 && v > 0 ? '<1%' : `${Math.round(v)}%`);

const PowerRanks = () => {
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

    // Weeks played inferred from the live standings, so everything adapts
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
        team,
        roster,
        starters,
        starterPpw,
        retained,
        replacementPpg,
        benchCount: Math.max(0, roster.length - starters.length),
      };
    });

    // --- Normalize each component 0..1 across the league ---
    const span = (vals: number[]) => {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return (v: number) => (max - min < 0.0001 ? 0.5 : (v - min) / (max - min));
    };

    const nStart = span(base.map((b) => b.starterPpw));
    const nDepth = span(base.map((b) => b.replacementPpg));
    const nStand = span(base.map((b) => b.team.totalPoints));

    // Standings only matter once games have been played
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

    // Simulation mean weekly output blends projected lineup with actual scoring
    const projMean = scored.reduce((s, b) => s + b.starterPpw, 0) / scored.length;
    const simTeams: SimTeam[] = scored.map((b) => {
      const actual = b.team.avgPPW;
      const blend =
        weeksPlayed > 0
          ? (b.starterPpw * (REG_SEASON_WEEKS - Math.min(weeksPlayed, REG_SEASON_WEEKS)) +
              actual * Math.min(weeksPlayed, REG_SEASON_WEEKS)) /
            REG_SEASON_WEEKS
          : b.starterPpw;
      // depth insurance: thin benches lose more output to injury over a season
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
  const weeksPlayed = rows[0]?.weeksPlayed ?? 0;

  return (
    <Layout>
      <div className="bg-[#1a2b4d] py-14 text-white">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Men's League
          </p>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">Power Ranks</h1>
          <p className="mt-3 max-w-3xl text-white/80">
            Every franchise graded 0–100 on live standings, the projected weekly output of its best
            starting lineup, and the quality of the depth behind it. Odds come from{' '}
            {SIMS.toLocaleString()} simulations of the remaining season and playoff format.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#bf2121]" />
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  label: 'Standings weight',
                  value:
                    weeksPlayed === 0
                      ? 'Preseason — 0%'
                      : `${Math.round(40 * Math.min(1, weeksPlayed / REG_SEASON_WEEKS))}% (Wk ${weeksPlayed})`,
                },
                { icon: Activity, label: 'Starting lineup', value: '9 slots · PPG = FPTS ÷ 17' },
                { icon: Shield, label: 'Depth test', value: 'Output retained per starter lost' },
              ].map((c) => (
                <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-[#bf2121]">
                    <c.icon className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {c.label}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-lg text-[#1a2b4d]">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="bg-[#1a2b4d] text-white">
                    <th className="px-3 py-3 text-left font-semibold">#</th>
                    <th className="px-3 py-3 text-left font-semibold">Team</th>
                    <th className="px-3 py-3 text-right font-semibold">Grade</th>
                    <th className="px-3 py-3 text-right font-semibold">Starter PPW</th>
                    <th className="px-3 py-3 text-right font-semibold">Depth</th>
                    <th className="px-3 py-3 text-right font-semibold">Top 2 Seed</th>
                    <th className="px-3 py-3 text-right font-semibold">Top 4 Seed</th>
                    <th className="px-3 py-3 text-right font-semibold">Top 5 Seed</th>
                    <th className="px-3 py-3 text-right font-semibold">Championship</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={r.team.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        'border-t border-neutral-200',
                        i % 2 === 1 && 'bg-neutral-50'
                      )}
                    >
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full font-serif font-bold',
                            i < 4
                              ? 'bg-emerald-100 text-emerald-800'
                              : i === 4
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-neutral-100 text-neutral-600'
                          )}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-serif text-base font-semibold text-[#1a2b4d]">
                          {r.team.name}
                        </div>
                        <div className="text-xs text-neutral-500">{r.team.owner}</div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="font-serif text-2xl font-bold text-[#bf2121]">
                          {r.score}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {r.starterPpw.toFixed(1)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {Math.round(r.retained * 100)}%
                        <div className="text-[11px] text-neutral-400">
                          {r.benchCount} bench
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{pct(r.odds.top2)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{pct(r.odds.top4)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{pct(r.odds.top5)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-[#1a2b4d]">
                        {pct(r.odds.champ)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
              <h2 className="mb-2 font-serif text-lg font-semibold text-[#1a2b4d]">
                How the grade is built
              </h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Starting lineup:</strong> best legal nine (QB / RB / RB / WR / WR / 3 FLEX
                  / OP) using projected fantasy points ÷ 17 games. Players without a public
                  projection are valued off their league contract.
                </li>
                <li>
                  <strong>Depth:</strong> each starter is removed in turn and the lineup rebuilt —
                  the percentage of weekly output a team retains through an injury is its depth
                  score. Thin benches also carry an injury drag into the simulation.
                </li>
                <li>
                  <strong>Standings:</strong> accumulated weekly points scale in as the season runs,
                  reaching 40% of the grade by Week {REG_SEASON_WEEKS}.
                </li>
                <li>
                  <strong>Odds:</strong> {SIMS.toLocaleString()} simulated seasons using the
                  Constitution's 20/18/16/14/12/5/4/3/2/1 weekly scale, then the Weeks 14–15
                  semifinal and the two-week championship.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PowerRanks;
