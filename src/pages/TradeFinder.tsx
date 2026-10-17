import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ArrowRight, CalendarDays, Loader2, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerSalaries, useTeams } from '@/hooks/usePlayerSalaries';
import { useTradeValues } from '@/hooks/useTradeValues';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useNflSchedule, emptySchedule } from '@/hooks/useNflSchedule';
import { assessRoster, findTrades, type FinderPlayer, type FinderTeam } from '@/lib/tradeFinder';

const num = (v: number) => v.toFixed(1);
const signed = (v: number) => `${v >= 0 ? '+' : ''}${num(v)}`;
const TradeFinder = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading, isError } = usePlayerSalaries();
  const { byId: values, isLoading: valuesLoading } = useTradeValues();
  const { data: scores = [] } = useWeeklyScores();
  const { data: schedule = emptySchedule } = useNflSchedule();
  const [selected, setSelected] = useState('');
  const startWeek = Math.min(17, Math.max(0, ...scores.map(s => s.week)) + 1);
  const league = useMemo<FinderTeam[]>(() => teams.map(team => {
    const seen = new Set<string>();
    const roster: FinderPlayer[] = salaries.filter(p => p.teamId === team.id && !p.practiceSquad).flatMap(p => {
      const name = `${p.firstName} ${p.lastName}`.trim();
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) return [];
      seen.add(key);
      const tv = values.get(p.id);
      const ppg = p.actualPpg ?? tv?.ppg ?? p.espnProjPpg ?? 0;
      return [{ id: p.id, name, position: p.position, ppg, basePpg: ppg, projected: p.actualPpg == null, nflTeam: p.nflTeam, out: ['out', 'ir'].includes(p.injuryStatus), injuryStatus: p.injuryStatus, weeksOut: p.injuryWeeksOut, value: tv?.value ?? 0, salary: tv?.salary ?? 1, franchiseTag: p.franchiseTag }];
    });
    return { ...team, roster };
  }), [teams, salaries, values]);
  const teamId = selected || league.find(t => t.roster.length)?.id || teams[0]?.id || '';
  const team = league.find(t => t.id === teamId);
  const assessment = useMemo(() => team ? assessRoster(team, league, startWeek) : null, [team, league, startWeek]);
  const suggestions = useMemo(() => team ? findTrades(team, league, startWeek, schedule) : [], [team, league, startWeek, schedule]);
  const loading = teamsLoading || salariesLoading || valuesLoading;
  return <Layout>
    <section className="border-b border-border bg-secondary/50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div><p className="mb-2 text-xs font-semibold uppercase text-accent">GM Tools</p><h1 className="font-display text-4xl font-bold text-primary">Trade Finder</h1></div>
          <div className="w-full max-w-md"><label className="mb-2 block text-sm font-semibold" id="finder-team-label">Your team</label><Select value={teamId} onValueChange={setSelected}><SelectTrigger aria-labelledby="finder-team-label"><SelectValue placeholder="Select a team" /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </div>
    </section>
    <div className="container mx-auto px-4 py-8">
      {loading ? <div className="flex items-center justify-center gap-3 py-20" role="status"><Loader2 className="h-6 w-6 animate-spin text-accent" />Assessing rosters…</div> : isError ? <p role="alert">Rosters could not be loaded. Please try again.</p> : !team?.roster.length ? <p className="py-12 text-muted-foreground">No active roster is available for this team.</p> : assessment && <>
        <div className="mb-6 flex items-center gap-3"><TeamLogo teamName={team.name} size="lg" /><div><h2 className="font-display text-2xl font-semibold text-primary">{team.name}</h2><p className="text-sm text-muted-foreground">{team.roster.length} active-roster players · Week {startWeek} onward</p></div></div>
        <div className="grid gap-5 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Weakest position', assessment.weakest, `${num(assessment.weakest.strength)} PPG · ${num(assessment.weakest.relative * 100)}% of league positional average`],
            ['Least depth', assessment.leastDepth, `${assessment.leastDepth.backups} available bench players · ${num(assessment.leastDepth.depth)} combined PPG`],
            ['Strongest position', assessment.strongest, `${num(assessment.strongest.strength)} PPG · ${num(assessment.strongest.relative * 100)}% of league positional average`],
            ['Most depth', assessment.mostDepth, `${assessment.mostDepth.backups} available bench players · ${num(assessment.mostDepth.depth)} combined PPG`],
          ].map(([label, stat, detail]) => <div key={String(label)}><p className="text-xs font-semibold uppercase text-muted-foreground">{String(label)}</p><p className="my-1 font-display text-3xl font-bold text-primary">{typeof stat !== 'string' ? stat.position : ''}</p><p className="text-sm text-muted-foreground">{String(detail)}</p></div>)}
        </div>
        <div className="grid gap-8 py-7 lg:grid-cols-2">
          <section><h3 className="mb-4 font-display text-xl font-semibold text-primary">Position report</h3><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2">Position</th><th>Core avg PPG</th><th>Bench</th><th>Bench PPG</th></tr></thead><tbody>{assessment.stats.map(s => <tr key={s.position} className="border-b border-border"><th className="py-3 text-left">{s.position}</th><td>{num(s.strength)}</td><td>{s.backups}</td><td>{num(s.depth)}</td></tr>)}</tbody></table><p className="mt-3 text-xs text-muted-foreground">Strength is relative to the league at that position: top QB, top two RBs/WRs, top TE. TE has no mandatory starting slot. Bench excludes the best legal nine; OUT/IR players are unavailable.</p></section>
          <section><h3 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-primary"><CalendarDays className="h-5 w-5 text-accent" />Upcoming bye exposure</h3>{assessment.byes.length ? <div className="divide-y divide-border">{assessment.byes.map(b => <div className="py-3" key={b.week}><div className="flex flex-wrap justify-between gap-2"><strong>Week {b.week}{b.week === 14 ? ' · Semifinals' : ''}</strong><span className={b.loss > 10 ? 'text-accent' : 'text-muted-foreground'}>{num(b.loss)} PPG replacement gap · {b.starters.length} starters</span></div><p className="mt-1 text-sm text-muted-foreground">{b.players.map(p => p.name).join(', ')}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No remaining roster byes through Week 14.</p>}</section>
        </div>
        <section className="border-t border-border pt-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold text-primary">Trade opportunities <span className="text-muted-foreground">({suggestions.length})</span></h2><span className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-win" />Both rosters improve</span></div>
          {!suggestions.length ? <p className="border-y border-border py-8 text-muted-foreground">No mutually beneficial trades within 10% of equal value meet the current roster checks.</p> : <div className="space-y-5">{suggestions.map((s, i) => {
            const params = new URLSearchParams({ teamA: team.id, teamB: s.partner.id, send: s.send.map(p => p.id).join(','), receive: s.receive.map(p => p.id).join(',') });
            const partnerReport = assessRoster(s.partner, league, startWeek);
            const yourSalary = team.roster.reduce((v, p) => v + p.salary, 0) + s.salaryChange;
            const partnerSalary = s.partner.roster.reduce((v, p) => v + p.salary, 0) + s.partnerSalaryChange;
            return <article key={`${s.partner.id}-${i}`} className="rounded-md border border-border bg-card p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><TeamLogo teamName={s.partner.name} /><h3 className="font-display text-xl font-semibold text-primary">{s.partner.name}</h3></div><span className={s.imbalance <= 2 ? 'text-win text-sm font-semibold' : 'text-muted-foreground text-sm'}>{num(s.imbalance)}% value gap{s.imbalance <= 2 ? ' · Ideal match' : ' · Wider match'}</span></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]"><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">You send · {num(s.valueSent)} TV</p>{s.send.map(p => <div key={p.id} className="flex flex-wrap justify-between gap-2 py-1"><strong>{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></strong><span className="text-sm text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</span></div>)}</div><ArrowLeftRight className="h-5 w-5 self-center text-accent" /><div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">You receive · {num(s.valueReceived)} TV</p>{s.receive.map(p => <div key={p.id} className="flex flex-wrap justify-between gap-2 py-1"><strong>{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></strong><span className="text-sm text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</span></div>)}</div></div>
              <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2"><div><p className="font-semibold">Your roster</p><p className="text-sm text-win">{signed(s.rosGain)} scheduled PPG · {signed(s.depthGain)} injury-cover PPG</p><p className="text-xs text-muted-foreground">2027 salary change: ${signed(s.salaryChange)}</p></div><div><p className="font-semibold">Partner’s roster</p><p className="text-sm text-win">{signed(s.partnerRosGain)} scheduled PPG · {signed(s.partnerDepthGain)} injury-cover PPG</p><p className="text-xs text-muted-foreground">2027 salary change: ${signed(s.partnerSalaryChange)}</p></div></div>
              <p className="mt-4 text-sm text-muted-foreground">You add {s.receive.map(p => p.position).filter((p, j, a) => a.indexOf(p) === j).join('/')} options; they add {s.send.map(p => p.position).filter((p, j, a) => a.indexOf(p) === j).join('/')} options. Your weakest position is {assessment.weakest.position}; theirs is {partnerReport.weakest.position}. The gains include injury returns, remaining byes and available opponent matchups.</p>
              {(yourSalary > 1000 || partnerSalary > 1000) && <p className="mt-3 text-sm text-accent">2027 cap planning required: your roster ${num(yourSalary)}; partner ${num(partnerSalary)}. Scoring gains are before any offseason cuts.</p>}
              <Button asChild variant="outline" className="mt-4"><Link to={`/trade-analyzer?${params}`}>Open in Trade Analyzer<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </article>;
          })}</div>}
          <p className="mt-5 text-xs text-muted-foreground">Trade Value Chart values set exchange balance. Actual player averages drive scoring; projections fill missing averages. Injury cover is average output with any one starter missing. Equal-size one- and two-player deals avoid forced roster cuts; franchise-tagged and practice-squad players are excluded. Future cap concerns are flagged separately; scoring gains are not a guarantee of cap compliance. Wider matches are disclosed, never presented as within 2%.</p>
        </section>
      </>}
    </div>
  </Layout>;
};
export default TradeFinder;