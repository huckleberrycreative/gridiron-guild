import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
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
                  <strong>Standings:</strong> accumulated weekly points grow every week, from 30% of
                  the grade after Week 1 to 75% by Week {REG_SEASON_WEEKS}.
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

type SortKey =
  | 'rank'
  | 'team'
  | 'grade'
  | 'starterPpw'
  | 'starterTv'
  | 'benchTv'
  | 'rosterTv'
  | 'top5'
  | 'top2'
  | 'champ';

type SortDir = 'asc' | 'desc';

const SortHeader = ({
  label,
  sortKey,
  sort,
  onToggle,
  className,
  align = 'center',
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: SortDir };
  onToggle: (key: SortKey) => void;
  className?: string;
  align?: 'left' | 'center';
}) => {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-2 py-3', align === 'left' ? 'text-left' : 'text-center', className)}
    >
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        title={`Sort by ${label}`}
        className={cn(
          'inline-flex items-center gap-1 font-semibold leading-tight transition-colors',
          align === 'center' && 'mx-auto',
          active ? 'text-white' : 'text-white/70 hover:text-white'
        )}
      >
        <span>{label}</span>
        {active ? (
          sort.dir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
};

export function PowerRanksTable({ rows, compact = false }: { rows: PowerRankRow[]; compact?: boolean }) {
  const { byId: tv } = useTradeValues();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'rank', dir: 'asc' });

  const avg = (list: { id: string }[]) => {
    const vals = list.map((p) => tv.get(p.id)?.value).filter((v): v is number => v != null);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  };
  const fmt = (n: number | null) => (n == null ? '—' : n.toFixed(1));

  const enriched = useMemo(
    () =>
      rows.map((r, i) => {
        const starterIds = new Set(r.starters.map((s) => s.id));
        return {
          r,
          rank: i + 1,
          starterTv: avg(r.starters),
          benchTv: avg(r.roster.filter((p) => !starterIds.has(p.id))),
          rosterTv: avg(r.roster),
        };
      }),
    [rows, tv]
  );

  const sorted = useMemo(() => {
    const value = (e: (typeof enriched)[number]): string | number | null => {
      switch (sort.key) {
        case 'rank':
          return e.rank;
        case 'team':
          return e.r.team.name;
        case 'grade':
          return e.r.score;
        case 'starterPpw':
          return e.r.lineupPpw ?? e.r.starterPpw;
        case 'starterTv':
          return e.starterTv;
        case 'benchTv':
          return e.benchTv;
        case 'rosterTv':
          return e.rosterTv;
        case 'top5':
          return e.r.odds.top5;
        case 'top2':
          return e.r.odds.top2;
        case 'champ':
          return e.r.odds.champ;
      }
    };
    return [...enriched].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (typeof av === 'string' && typeof bv === 'string') {
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = av == null ? -Infinity : (av as number);
      const bn = bv == null ? -Infinity : (bv as number);
      return sort.dir === 'asc' ? an - bn : bn - an;
    });
  }, [enriched, sort]);

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'rank' || key === 'team' ? 'asc' : 'desc' }
    );

  const td = 'px-2 py-3 text-center tabular-nums';
  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-3 py-2">
        <span className="text-[11px] uppercase tracking-wider text-neutral-400">
          Click any column to sort
        </span>
        <span className="text-[11px] text-neutral-400">
          Sorted by{' '}
          <span className="font-semibold text-[#1a2b4d]">
            {{
              rank: 'Power Rank',
              team: 'Team',
              grade: 'Grade',
              starterPpw: 'Starter PPW',
              starterTv: 'Starter Avg TV',
              benchTv: 'Bench Avg TV',
              rosterTv: 'Roster Avg TV',
              top5: 'Playoff Odds',
              top2: 'Top 2 Seed',
              champ: 'Champ Odds',
            }[sort.key]}
          </span>{' '}
          {sort.dir === 'asc' ? '↑' : '↓'}
        </span>
      </div>
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="bg-[#1a2b4d] text-white">
            <SortHeader label="#" sortKey="rank" sort={sort} onToggle={toggle} align="left" className="w-12" />
            <SortHeader label="Team" sortKey="team" sort={sort} onToggle={toggle} align="left" className="w-[22%]" />
            <SortHeader label="Grade" sortKey="grade" sort={sort} onToggle={toggle} />
            <SortHeader label="Starter PPW" sortKey="starterPpw" sort={sort} onToggle={toggle} />
            {!compact && (
              <SortHeader label="Starter Avg TV" sortKey="starterTv" sort={sort} onToggle={toggle} />
            )}
            {!compact && <SortHeader label="Bench Avg TV" sortKey="benchTv" sort={sort} onToggle={toggle} />}
            {!compact && <SortHeader label="Roster Avg TV" sortKey="rosterTv" sort={sort} onToggle={toggle} />}
            <SortHeader label="Playoff Odds" sortKey="top5" sort={sort} onToggle={toggle} />
            <SortHeader label="Top 2 Seed" sortKey="top2" sort={sort} onToggle={toggle} />
            <SortHeader label="Champ Odds" sortKey="champ" sort={sort} onToggle={toggle} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => {
            const r = e.r;
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
                      e.rank <= 4
                        ? 'bg-emerald-100 text-emerald-800'
                        : e.rank === 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {e.rank}
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
                <td className={td}>{(r.lineupPpw ?? r.starterPpw).toFixed(1)}</td>
                {!compact && <td className={td}>{fmt(e.starterTv)}</td>}
                {!compact && <td className={td}>{fmt(e.benchTv)}</td>}
                {!compact && <td className={td}>{fmt(e.rosterTv)}</td>}
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
