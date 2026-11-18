import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { TeamLogo } from '@/components/TeamLogo';
import { SortableTable, type Column } from '@/components/SortableTable';
import { careerRow, governor, ordinal, weeklyHeadToHead, type SeasonRow, type HeadToHead } from '@/lib/leagueHistory';
import { GovLink, ResultBadge, StatTile, fmt1, pct, record } from '@/components/history/HistoryBits';
import { ArrowLeft, Trophy, TrendingDown, TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeagueHistory } from '@/hooks/useLeagueHistory';

const seasonCols: Column<SeasonRow>[] = [
  { key: 'year', label: 'Year', sortable: true },
  { key: 'team', label: 'Team', sortable: true, className: 'min-w-[160px]' },
  { key: 'rank', label: 'Finish', sortable: true, align: 'center', render: (_, r) => `${ordinal(r.rank)} / ${r.fieldSize}` },
  { key: 'winPct', label: 'Record', sortable: true, align: 'center', render: (_, r) => <span className="font-mono">{record(r.wins, r.losses, r.ties)}</span> },
  { key: 'ap', label: 'Stnd Pts', sortable: true, align: 'right', render: (v) => (v === null ? '—' : String(v)) },
  { key: 'pf', label: 'PF', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'ppw', label: 'PPW', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'highWeek', label: 'High', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'lowWeek', label: 'Low', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'heartbreak', label: 'Heartbreak', sortable: true, align: 'right', render: (v) => (v === null ? '—' : `${v}%`) },
  { key: 'consistency', label: 'Consist. Rk', sortable: true, align: 'center', render: (v) => (v === null ? '—' : `#${v}`) },
  { key: 'result', label: 'Playoffs', sortable: true, align: 'center', render: (_, r) => <ResultBadge result={r.result} /> },
];

const h2hCols: Column<HeadToHead & { pctv: number }>[] = [
  { key: 'opponent', label: 'Opponent', sortable: true, render: (_, r) => <GovLink slug={r.opponent} /> },
  { key: 'wins', label: 'Outscored', sortable: true, align: 'center' },
  { key: 'losses', label: 'Outscored by', sortable: true, align: 'center' },
  { key: 'pctv', label: 'Win %', sortable: true, align: 'right', render: (v) => pct(v as number) },
];

export default function GovernorProfile() {
  const { slug = '' } = useParams();
  const g = governor(slug);
  const { history } = useLeagueHistory();
  const c = careerRow(slug, history.rows);
  const rows = history.rows.filter((r) => r.gov === slug);

  const { data: profile } = useQuery({
    queryKey: ['governor-profile', g?.currentTeam],
    enabled: Boolean(g?.currentTeam),
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('shield_bio, governor_response, highest_high, lowest_low, profile_image_url').eq('name', g!.currentTeam!).maybeSingle();
      return data;
    },
  });

  if (!g || !c) {
    return (
      <Layout><div className="container mx-auto px-4 py-16"><p>Governor not found.</p><Link to="/meet-the-league" className="text-accent underline">Back to Meet the League</Link></div></Layout>
    );
  }

  const done = rows.filter((r) => !r.inProgress);
  const best = [...done].sort((a, b) => a.rank - b.rank || b.pf - a.pf)[0];
  const worst = [...done].sort((a, b) => b.rank - a.rank || a.pf - b.pf)[0];
  const h2h = weeklyHeadToHead(slug, history.weekly).map((h) => ({ ...h, pctv: h.wins + h.losses ? h.wins / (h.wins + h.losses + h.ties) : 0 }));
  const teamNames = [...new Set(rows.map((r) => r.team))];
  const maxField = Math.max(...rows.map((r) => r.fieldSize));
  const live = rows.find((r) => r.inProgress);

  return (
    <Layout>
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/meet-the-league" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft size={14} /> All Governors</Link>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-col gap-5 bg-gradient-to-r from-primary/15 to-accent/10 p-5 md:flex-row md:items-center md:p-7">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow">
                {profile?.profile_image_url ? <img src={profile.profile_image_url} alt={g.name} className="h-full w-full object-cover" /> : <User size={36} className="text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-3xl font-bold">{g.name}</h1>
                <p className="font-semibold text-accent">{g.currentTeam ?? 'Former Governor'}</p>
                <p className="text-sm text-muted-foreground">{c.seasons} seasons · {c.firstYear}–{c.lastYear}</p>
                {c.titleYears.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.titleYears.map((y) => <span key={y} className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold"><Trophy size={12} /> {y} Champion</span>)}
                  </div>
                )}
              </div>
              {g.currentTeam && <TeamLogo teamName={g.currentTeam} size="lg" className="hidden h-24 w-24 md:block" />}
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-8">
              <StatTile label="Titles" value={c.titles} sub={`${c.finals} finals`} />
              <StatTile label="Record" value={record(c.wins, c.losses, c.ties)} sub={pct(c.winPct)} />
              <StatTile label="Playoffs" value={`${c.playoffs}/${c.seasons}`} sub={pct(c.playoffPct)} />
              <StatTile label="Playoff W-L" value={`${c.playoffWins}-${c.playoffLosses}`} sub={c.playoffWins + c.playoffLosses ? pct(c.playoffWinPct) : '—'} />
              <StatTile label="Avg Finish" value={fmt1(c.avgRank)} sub={`Best ${ordinal(c.bestRank)} · Worst ${ordinal(c.worstRank)}`} />
              <StatTile label="Points / Week" value={fmt1(c.ppw)} sub={`${fmt1(c.pfPerSeason)} per season`} />
              <StatTile label="Standings Pts" value={c.ap} sub={`${fmt1(c.apPerSeason)} per season`} />
              <StatTile label="Best / Worst Wk" value={c.highWeek === null ? '—' : `${fmt1(c.highWeek)}`} sub={c.lowWeek === null ? 'No weekly data' : `Low ${fmt1(c.lowWeek)}`} />
            </div>
          </div>

          {(profile?.shield_bio || profile?.governor_response) && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {profile?.shield_bio && <div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Shield Bio</h3><p className="leading-relaxed">{profile.shield_bio}</p></div>}
              {profile?.governor_response && <div className="rounded-lg border-l-4 border-accent bg-muted/50 p-5"><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Governor's Response</h3><p className="italic leading-relaxed">{profile.governor_response}</p></div>}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-2 flex items-center gap-2"><TrendingUp size={18} className="text-primary" /><h3 className="text-xs font-bold uppercase tracking-wider">Highest High</h3></div>
              <p>{profile?.highest_high || (c.titles ? `${c.titleYears.join(', ')} champion${c.titles > 1 ? 's' : ''}.` : `${best.year}: finished ${ordinal(best.rank)} of ${best.fieldSize} at ${record(best.wins, best.losses, best.ties)} with ${fmt1(best.pf)} points as ${best.team}.`)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-2 flex items-center gap-2"><TrendingDown size={18} className="text-accent" /><h3 className="text-xs font-bold uppercase tracking-wider">Lowest Low</h3></div>
              <p>{profile?.lowest_low || `${worst.year}: finished ${ordinal(worst.rank)} of ${worst.fieldSize} at ${record(worst.wins, worst.losses, worst.ties)} as ${worst.team}.`}</p>
            </div>
          </div>

          <h2 className="mb-3 mt-8 font-display text-xl font-bold">Finish by Season</h2>
          <div className="flex items-end gap-2 overflow-x-auto rounded-lg border border-border bg-card p-4">
            {rows.map((r) => {
              const h = ((maxField - r.rank + 1) / maxField) * 100;
              return (
                <div key={r.year} className="flex min-w-[44px] flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-bold">{ordinal(r.rank)}</span>
                  <div className="flex h-28 w-full items-end">
                    <div className={cn('w-full rounded-t', r.inProgress ? 'bg-accent/60' : r.result === 'Champion' ? 'bg-gold' : r.seed ? 'bg-primary' : 'bg-muted-foreground/30')} style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{r.year}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Gold = title · Navy = playoff team · Grey = missed playoffs{live ? ` · Red = ${live.year} current standing (through Week ${history.liveWeeks})` : ''}.</p>

          <h2 className="mb-3 mt-8 font-display text-xl font-bold">Season-by-Season</h2>
          <SortableTable data={rows} columns={seasonCols} defaultSortKey="year" />

          {rows.some((r) => r.seed) && (
            <>
              <h2 className="mb-3 mt-8 font-display text-xl font-bold">Playoff History</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.filter((r) => r.seed).map((r) => (
                  <div key={r.year} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between"><span className="font-display font-bold">{r.year}</span><ResultBadge result={r.result} /></div>
                    <p className="mt-1 text-sm text-muted-foreground">#{r.seed} seed · Wk 14–15 score {fmt1(r.semi)}{r.final !== null ? ` · Wk 16–17 ${r.result === 'Champion' || r.result === 'Runner-Up' ? 'final' : 'consolation'} ${fmt1(r.final)}` : ''}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {h2h.length > 0 && (
            <>
              <h2 className="mb-1 mt-8 font-display text-xl font-bold">Week-by-Week Scoring vs. Each Governor</h2>
              <p className="mb-3 text-sm text-muted-foreground">How often {g.short} outscored each rival in the same week (2017–2023{history.liveYear ? ` and ${history.liveYear}` : ''} weekly data).</p>
              <SortableTable data={h2h} columns={h2hCols} defaultSortKey="pctv" />
            </>
          )}

          <h2 className="mb-3 mt-8 font-display text-xl font-bold">Team Names</h2>
          <div className="flex flex-wrap gap-2">
            {teamNames.map((n) => <span key={n} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{n}</span>)}
          </div>
        </div>
      </section>
    </Layout>
  );
}
