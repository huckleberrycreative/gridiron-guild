import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { TeamLogo } from '@/components/TeamLogo';
import { SortableTable, type Column } from '@/components/SortableTable';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CAREERS, ordinal, type CareerRow } from '@/lib/leagueHistory';
import { GovLink, fmt1, pct, record } from '@/components/history/HistoryBits';
import { Trophy, User } from 'lucide-react';

const columns: Column<CareerRow>[] = [
  { key: 'name', label: 'Governor', sortable: true, render: (_, r) => <GovLink slug={r.slug} /> },
  { key: 'seasons', label: 'Yrs', sortable: true, align: 'center' },
  { key: 'titles', label: 'Titles', sortable: true, align: 'center', render: (v) => (Number(v) ? <span className="font-bold text-gold">{String(v)}</span> : '0') },
  { key: 'finals', label: 'Finals', sortable: true, align: 'center' },
  { key: 'playoffs', label: 'Playoffs', sortable: true, align: 'center' },
  { key: 'winPct', label: 'Record', sortable: true, align: 'center', render: (_, r) => <span className="font-mono">{record(r.wins, r.losses, r.ties)}</span> },
  { key: 'ppw', label: 'PPW', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'avgRank', label: 'Avg Finish', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
];

const MeetTheLeague = () => {
  const [scope, setScope] = useState<'active' | 'all'>('active');
  const navigate = useNavigate();
  const list = CAREERS.filter((c) => scope === 'all' || c.active).sort((a, b) => b.titles - a.titles || b.winPct - a.winPct);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">MEET THE LEAGUE</h1>
              <p className="text-muted-foreground">Every Governor since 2017 — tap anyone for their full career file.</p>
            </div>
            <ToggleGroup type="single" value={scope} onValueChange={(v) => v && setScope(v as 'active' | 'all')} className="justify-start">
              <ToggleGroupItem value="active">Current Governors</ToggleGroupItem>
              <ToggleGroupItem value="all">All-Time ({CAREERS.length})</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {list.map((c) => (
              <Link key={c.slug} to={`/meet-the-league/${c.slug}`} className="group rounded-lg border border-border bg-card p-4 transition hover:border-accent hover:shadow-md">
                <div className="flex items-center gap-3">
                  {c.currentTeam ? (
                    <TeamLogo teamName={c.currentTeam} size="md" className="h-12 w-12 shrink-0" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted"><User size={20} className="text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-display font-bold group-hover:text-accent">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.currentTeam ?? `Former · ${c.firstYear}–${c.lastYear}`}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-gold">
                  {c.titles > 0 ? Array.from({ length: c.titles }).map((_, i) => <Trophy key={i} size={14} />) : <span className="text-xs text-muted-foreground">No titles yet</span>}
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><dt className="text-muted-foreground">Record</dt><dd className="font-mono font-semibold">{record(c.wins, c.losses, c.ties)}</dd></div>
                  <div><dt className="text-muted-foreground">Playoffs</dt><dd className="font-semibold">{c.playoffs}/{c.seasons}</dd></div>
                  <div><dt className="text-muted-foreground">Best</dt><dd className="font-semibold">{ordinal(c.bestRank)}</dd></div>
                </dl>
                <div className="mt-2 text-center text-[11px] text-muted-foreground">{pct(c.winPct)} wins · {fmt1(c.ppw)} PPW</div>
              </Link>
            ))}
          </div>

          <h2 className="mb-3 mt-10 font-display text-xl font-bold">Career Leaderboard</h2>
          <SortableTable data={list} columns={columns} defaultSortKey="titles" onRowClick={(r) => navigate(`/meet-the-league/${r.slug}`)} />
          <p className="mt-2 text-xs text-muted-foreground">Seasons 2017–2025. Click any column to sort.</p>
        </div>
      </section>
    </Layout>
  );
};

export default MeetTheLeague;
