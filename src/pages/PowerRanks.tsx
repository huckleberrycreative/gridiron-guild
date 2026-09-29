import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import {
  usePowerRankRows,
  SIMS,
  REG_SEASON_WEEKS,
  type PowerRankRow,
} from '@/hooks/usePowerRanks';
import { cn } from '@/lib/utils';
import { useTradeValues } from '@/hooks/useTradeValues';
import { Loader2, TrendingUp, Shield, Activity } from 'lucide-react';

const pct = (v: number) => (v >= 99.5 ? '>99%' : v < 0.5 && v > 0 ? '<1%' : `${Math.round(v)}%`);

const PowerRanks = () => {
  const { rows, loading, weeksPlayed } = usePowerRankRows();

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

            <PowerRanksTable rows={rows} />

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
                  <strong>Injuries:</strong> players marked out or on IR are pulled from the lineup
                  entirely; questionable and doubtful tags discount a player's weekly output. Grades
                  and odds move the moment the injury report is updated.
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

export function PowerRanksTable({ rows, compact = false }: { rows: PowerRankRow[]; compact?: boolean }) {
  const { byId: tv } = useTradeValues();
  const avg = (list: { id: string }[]) => {
    const vals = list.map((p) => tv.get(p.id)?.value).filter((v): v is number => v != null);
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '—';
  };
  const th = 'px-2 py-3 text-center font-semibold leading-tight';
  const td = 'px-2 py-3 text-center tabular-nums';
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="bg-[#1a2b4d] text-white">
            <th className="w-12 px-2 py-3 text-left font-semibold">#</th>
            <th className="w-[22%] px-2 py-3 text-left font-semibold">Team</th>
            <th className={th}>Grade</th>
            <th className={th}>Starter PPW</th>
            {!compact && <th className={th}>Starter Avg TV</th>}
            {!compact && <th className={th}>Bench Avg TV</th>}
            {!compact && <th className={th}>Roster Avg TV</th>}
            <th className={th}>Playoff Odds (Top 5)</th>
            <th className={th}>Top 2 Seed</th>
            <th className={th}>Champ Odds</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const starterIds = new Set(r.starters.map((s) => s.id));
            const bench = r.roster.filter((p) => !starterIds.has(p.id));
            return (
              <motion.tr
                key={r.team.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn('border-t border-neutral-200', i % 2 === 1 && 'bg-neutral-50')}
              >
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
                  <div className="truncate font-serif text-base font-semibold text-[#1a2b4d]">
                    {r.team.name}
                  </div>
                  <div className="truncate text-xs text-neutral-500">{r.team.owner}</div>
                  {!compact && r.injured.length > 0 && (
                    <div className="mt-1 truncate text-[11px] text-[#bf2121]" title={r.injured.map((p) => p.name).join(', ')}>
                      OUT: {r.injured.map((p) => `${p.name}${p.weeksOut ? ` (${p.weeksOut}w)` : ''}`).join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-2 py-3 text-center">
                  <span className="font-serif text-2xl font-bold text-[#bf2121]">{r.score}</span>
                </td>
                <td className={td}>{r.starterPpw.toFixed(1)}</td>
                {!compact && <td className={td}>{avg(r.starters)}</td>}
                {!compact && <td className={td}>{avg(bench)}</td>}
                {!compact && <td className={td}>{avg(r.roster)}</td>}
                <td className={td}>{pct(r.odds.top5)}</td>
                <td className={td}>{pct(r.odds.top2)}</td>
                <td className={cn(td, 'font-semibold text-[#1a2b4d]')}>{pct(r.odds.champ)}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PowerRanks;
