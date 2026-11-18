import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, type Column } from '@/components/SortableTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { governor, ordinal, type CareerRow, type SeasonRow, type WeekScore } from '@/lib/leagueHistory';
import { GovLink, ResultBadge, StatTile, fmt1, pct, record } from '@/components/history/HistoryBits';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeagueHistory } from '@/hooks/useLeagueHistory';

const careerCols: Column<CareerRow>[] = [
  { key: 'name', label: 'Governor', sortable: true, render: (_, r) => <GovLink slug={r.slug} /> },
  { key: 'seasons', label: 'Yrs', sortable: true, align: 'center' },
  { key: 'titles', label: 'Titles', sortable: true, align: 'center', render: (v) => (Number(v) ? <span className="font-bold text-gold">{String(v)}</span> : '0') },
  { key: 'finals', label: 'Finals', sortable: true, align: 'center' },
  { key: 'playoffs', label: 'Playoffs', sortable: true, align: 'center' },
  { key: 'playoffPct', label: 'Playoff %', sortable: true, align: 'right', render: (v) => pct(v as number) },
  { key: 'playoffWinPct', label: 'Playoff W%', sortable: true, align: 'right', render: (_, r) => (r.playoffWins + r.playoffLosses ? `${r.playoffWins}-${r.playoffLosses}` : '—') },
  { key: 'winPct', label: 'Record', sortable: true, align: 'center', render: (_, r) => <span className="whitespace-nowrap font-mono">{record(r.wins, r.losses, r.ties)} <span className="text-xs text-muted-foreground">{pct(r.winPct)}</span></span> },
  { key: 'ap', label: 'Stnd Pts', sortable: true, align: 'right' },
  { key: 'apPerSeason', label: 'Pts/Yr', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'pf', label: 'Total PF', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'ppw', label: 'PPW', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'avgRank', label: 'Avg Fin', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'highWeek', label: 'Best Wk', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
];

const seasonCols: Column<SeasonRow>[] = [
  { key: 'rank', label: '#', sortable: true, align: 'center' },
  { key: 'name', label: 'Governor', sortable: true, render: (_, r) => <GovLink slug={r.gov} /> },
  { key: 'team', label: 'Team', sortable: true, className: 'min-w-[170px]' },
  { key: 'winPct', label: 'Record', sortable: true, align: 'center', render: (_, r) => <span className="font-mono">{record(r.wins, r.losses, r.ties)}</span> },
  { key: 'ap', label: 'Stnd Pts', sortable: true, align: 'right', render: (v) => (v === null ? '—' : String(v)) },
  { key: 'pf', label: 'PF', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'ppw', label: 'PPW', sortable: true, align: 'right', render: (v) => fmt1(v as number) },
  { key: 'highWeek', label: 'High', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'stdDev', label: 'Std Dev', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'semi', label: 'Wk 14–15', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'final', label: 'Wk 16–17', sortable: true, align: 'right', render: (v) => fmt1(v as number | null) },
  { key: 'result', label: 'Result', sortable: true, align: 'center', render: (_, r) => <ResultBadge result={r.result} /> },
];

const weekCols: Column<WeekScore & { name: string }>[] = [
  { key: 'score', label: 'Score', sortable: true, align: 'right', render: (v) => <span className="font-bold">{fmt1(v as number)}</span> },
  { key: 'name', label: 'Governor', sortable: true, render: (_, r) => <GovLink slug={r.gov} /> },
  { key: 'year', label: 'Year', sortable: true, align: 'center' },
  { key: 'week', label: 'Week', sortable: true, align: 'center' },
];

function bestBy<T>(xs: T[], f: (x: T) => number | null, dir: 1 | -1 = 1): T {
  return [...xs].filter((x) => f(x) !== null).sort((a, b) => dir * ((f(b) as number) - (f(a) as number)))[0];
}

export default function HistoricAnalytics() {
  const { history } = useLeagueHistory();
  const { rows: ALL_SEASON_ROWS, weeks: ALL_WEEKS, careers: CAREERS, champions: CHAMPIONS, years: YEARS, seasons: SEASONS } = history;
  const [picked, setYear] = useState<string | null>(null);
  const year = picked ?? String(YEARS[YEARS.length - 1]);
  const [scope, setScope] = useState<'active' | 'all'>('active');
  const [weekView, setWeekView] = useState<'high' | 'low'>('high');
  const careers = CAREERS.filter((c) => scope === 'all' || c.active);
  const season = SEASONS.find((s) => String(s.year) === year) ?? SEASONS[SEASONS.length - 1];
  const seasonRows = ALL_SEASON_ROWS.filter((r) => String(r.year) === year);

  const weeks = useMemo(() => {
    const sorted = [...ALL_WEEKS].sort((a, b) => (weekView === 'high' ? b.score - a.score : a.score - b.score));
    return sorted.slice(0, 25).map((w) => ({ ...w, name: governor(w.gov)?.name ?? w.gov }));
  }, [weekView, ALL_WEEKS]);

  const records = useMemo(() => {
    const hi = bestBy(ALL_WEEKS, (w) => w.score);
    const lo = bestBy(ALL_WEEKS, (w) => w.score, -1);
    const doneRows = ALL_SEASON_ROWS.filter((r) => !r.inProgress);
    const pf = bestBy(doneRows, (r) => r.ppw);
    const lowPf = bestBy(doneRows, (r) => r.ppw, -1);
    const ap = bestBy(doneRows, (r) => r.ap);
    const final = bestBy(ALL_SEASON_ROWS.filter((r) => r.result === 'Champion'), (r) => r.final);
    const steady = bestBy(doneRows.filter((r) => r.stdDev !== null), (r) => r.stdDev, -1);
    const perfect = doneRows.filter((r) => r.losses === 0 && r.ties === 0);
    const titles = bestBy(CAREERS, (c) => c.titles);
    const winPct = bestBy(CAREERS.filter((c) => c.seasons >= 3), (c) => c.winPct);
    const name = (s: string) => governor(s)?.name ?? s;
    return [
      { label: 'Highest single week', value: fmt1(hi.score), who: hi.gov, when: `${hi.year} · Week ${hi.week}` },
      { label: 'Lowest single week', value: fmt1(lo.score), who: lo.gov, when: `${lo.year} · Week ${lo.week}` },
      { label: 'Best season scoring', value: `${fmt1(pf.ppw)} PPW`, who: pf.gov, when: `${pf.year} · ${fmt1(pf.pf)} PF` },
      { label: 'Worst season scoring', value: `${fmt1(lowPf.ppw)} PPW`, who: lowPf.gov, when: `${lowPf.year} · ${fmt1(lowPf.pf)} PF` },
      { label: 'Most standings points', value: String(ap.ap), who: ap.gov, when: String(ap.year) },
      { label: 'Biggest title-game score', value: fmt1(final.final), who: final.gov, when: String(final.year) },
      { label: 'Most consistent season', value: `±${fmt1(steady.stdDev)}`, who: steady.gov, when: `${steady.year} weekly std dev` },
      { label: 'Undefeated seasons', value: String(perfect.length), who: perfect[0]?.gov ?? '', when: perfect.map((r) => `${name(r.gov).split(' ')[0]} ${r.year}`).join(' · ') },
      { label: 'Most championships', value: String(titles.titles), who: titles.slug, when: titles.titleYears.join(', ') },
      { label: 'Best career win % (3+ yrs)', value: pct(winPct.winPct), who: winPct.slug, when: record(winPct.wins, winPct.losses, winPct.ties) },
    ];
  }, [ALL_WEEKS, ALL_SEASON_ROWS, CAREERS]);

  const gridGovs = CAREERS.filter((c) => scope === 'all' || c.active).sort((a, b) => a.avgRank - b.avgRank);

  return (
    <Layout>
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl font-bold md:text-4xl">HISTORIC ANALYTICS</h1>
          <p className="mb-6 text-muted-foreground">{`Every season since 2017${history.liveYear ? `, including ${history.liveYear} through Week ${history.liveWeeks}` : ''}, calculated from the league's official records.`}</p>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Seasons" value={YEARS.length} sub={`${YEARS[0]}–${YEARS[YEARS.length - 1]}`} />
            <StatTile label="Governors" value={CAREERS.length} sub={`${CAREERS.filter((c) => c.active).length} active`} />
            <StatTile label="Most Titles" value={records[8].value} sub={governor(records[8].who)?.name} />
            <StatTile label="Weekly Scores Logged" value={ALL_WEEKS.length.toLocaleString()} sub={history.liveYear ? `2017–2023 + ${history.liveYear} Wk 1–${history.liveWeeks}` : "2017–2023"} />
          </div>

          <Tabs defaultValue="alltime">
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
              <TabsTrigger value="alltime">All-Time</TabsTrigger>
              <TabsTrigger value="seasons">Seasons</TabsTrigger>
              <TabsTrigger value="champions">Champions</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="grid">Finish Grid</TabsTrigger>
            </TabsList>

            <TabsContent value="alltime">
              <ToggleGroup type="single" value={scope} onValueChange={(v) => v && setScope(v as 'active' | 'all')} className="mb-3 justify-start">
                <ToggleGroupItem value="active">Current Governors</ToggleGroupItem>
                <ToggleGroupItem value="all">Include Former</ToggleGroupItem>
              </ToggleGroup>
              <SortableTable data={careers} columns={careerCols} defaultSortKey="titles" />
            </TabsContent>

            <TabsContent value="seasons">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{[...YEARS].reverse().map((y) => <SelectItem key={y} value={String(y)}>{y} Season</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{season.entries.length} teams · {season.weeks} weeks{season.note ? ` · ${season.note}` : ''}</span>
              </div>
              <SortableTable data={seasonRows} columns={seasonCols} defaultSortKey="rank" defaultSortAsc />
              {season.inProgress ? <p className="mt-2 text-xs text-muted-foreground">Live standings from saved weekly scores (20/18/16/14/8/4/3/2/1/0 finish points; top 4 = W, 5th = T).</p> : <p className="mt-2 text-xs text-muted-foreground">Playoff seeds hold ranks 1–{season.playoffs.length}; Wk 14–15 is the standings-adjusted semifinal score. A Wk 16–17 score for a non-finalist is the consolation game.</p>}
            </TabsContent>

            <TabsContent value="champions">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...CHAMPIONS].reverse().map((c) => (
                  <div key={c.year} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between"><span className="font-display text-2xl font-bold">{c.year}</span><Trophy className="text-gold" size={22} /></div>
                    <GovLink slug={c.champion} className="mt-1 block text-lg" />
                    <p className="text-sm text-muted-foreground">{c.champTeam}</p>
                    <p className="mt-2 text-sm">Beat <GovLink slug={c.runnerUp} className="font-normal" /> <span className="font-mono">{fmt1(c.champScore)}–{fmt1(c.runnerScore)}</span></p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="records">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {records.map((r) => (
                  <div key={r.label} className="rounded-lg border border-border bg-card p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{r.label}</div>
                    <div className="mt-1 font-display text-2xl font-bold">{r.value}</div>
                    {r.label !== 'Undefeated seasons' && <GovLink slug={r.who} className="text-sm" />}
                    <div className="text-xs text-muted-foreground">{r.when}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold">Top 25 Weekly Scores</h2>
                <ToggleGroup type="single" value={weekView} onValueChange={(v) => v && setWeekView(v as 'high' | 'low')}>
                  <ToggleGroupItem value="high">Highest</ToggleGroupItem>
                  <ToggleGroupItem value="low">Lowest</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <SortableTable data={weeks} columns={weekCols} />
            </TabsContent>

            <TabsContent value="grid">
              <ToggleGroup type="single" value={scope} onValueChange={(v) => v && setScope(v as 'active' | 'all')} className="mb-3 justify-start">
                <ToggleGroupItem value="active">Current Governors</ToggleGroupItem>
                <ToggleGroupItem value="all">Include Former</ToggleGroupItem>
              </ToggleGroup>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead><tr className="bg-primary text-primary-foreground">
                    <th className="sticky left-0 bg-primary px-3 py-2 text-left text-xs uppercase">Governor</th>
                    {YEARS.map((y) => <th key={y} className="px-2 py-2 text-center text-xs">{y}</th>)}
                    <th className="px-2 py-2 text-center text-xs">Avg</th>
                  </tr></thead>
                  <tbody className="bg-card">
                    {gridGovs.map((c) => (
                      <tr key={c.slug} className="border-b border-border last:border-0">
                        <td className="sticky left-0 whitespace-nowrap bg-card px-3 py-2"><GovLink slug={c.slug} /></td>
                        {YEARS.map((y) => {
                          const r = ALL_SEASON_ROWS.find((x) => x.year === y && x.gov === c.slug);
                          return (
                            <td key={y} className="px-1 py-1 text-center">
                              {r ? (
                                <span title={`${r.team} · ${record(r.wins, r.losses, r.ties)} · ${r.result}`} className={cn('inline-block min-w-[40px] rounded px-1.5 py-1 text-xs font-semibold', r.inProgress ? 'border border-dashed border-accent text-accent' : r.result === 'Champion' ? 'bg-gold text-gold-foreground' : r.result === 'Runner-Up' ? 'bg-primary text-primary-foreground' : r.seed ? 'bg-primary/15 text-primary' : 'text-muted-foreground')}>
                                  {ordinal(r.rank)}
                                </span>
                              ) : <span className="text-muted-foreground/40">·</span>}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1 text-center font-semibold">{fmt1(c.avgRank)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Gold = champion · Navy = runner-up · Light navy = other playoff team · Dashed red = current live standing.</p>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
