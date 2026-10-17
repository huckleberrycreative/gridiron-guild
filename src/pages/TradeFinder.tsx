import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { getTeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerSalaries, useTeams } from '@/hooks/usePlayerSalaries';
import { useTradeValues } from '@/hooks/useTradeValues';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useNflSchedule, emptySchedule } from '@/hooks/useNflSchedule';
import { findTrades, type FinderPlayer, type FinderTeam } from '@/lib/tradeFinder';
import { bestLineup, healthyRoster } from '@/lib/seasonSimulation';

const num = (v: number) => v.toFixed(1);
const signed = (v: number) => `${v >= 0 ? '+' : ''}${num(v)}`;
const tradeReason = (team: FinderTeam, outgoing: FinderPlayer[], incoming: FinderPlayer[], scoringGain: number, coverGain: number) => {
  const outgoingIds = new Set(outgoing.map(p => p.id));
  const after = [...team.roster.filter(p => !outgoingIds.has(p.id)), ...incoming];
  const starterIds = new Set(bestLineup(healthyRoster(after)).map(p => p.id));
  const additions = incoming.map(p => `${p.name}${p.position === 'TE' ? ' (FLEX)' : ''}`).join(' and ');
  const starters = incoming.filter(p => starterIds.has(p.id));
  if (scoringGain < 0.05) {
    return `Make this move for protection, not a scoring splash: ${additions} gives you stronger fallback options if a starter gets injured, improving replacement scoring by ${num(coverGain)} points per week while keeping expected weekly output essentially intact.`;
  }
  const role = starters.length
    ? `${starters.map(p => p.name).join(' and ')} can strengthen your starting lineup`
    : `${additions} gives you more options when injuries or bye weeks leave gaps`;
  const protection = coverGain >= 0.05 ? `, with another ${num(coverGain)} points of improved injury-replacement scoring` : '';
  return `This is ${scoringGain < 0.5 ? 'a small but useful' : 'a worthwhile'} roster-fit upgrade: ${role}, adding an expected ${num(scoringGain)} points per week${protection}.`;
};
const FinderLogo = ({ name, large = false }: { name: string; large?: boolean }) => {
  const [failed, setFailed] = useState(false);
  const url = getTeamLogo(name);
  return <span className={`flex shrink-0 items-center justify-center rounded bg-secondary text-primary ${large ? 'h-12 w-12' : 'h-8 w-8'}`}>
    {url && !failed ? <img src={url} alt={name} onError={() => setFailed(true)} className="h-full w-full object-contain" /> : <ShieldCheck className="h-5 w-5" aria-label={name} />}
  </span>;
};
const TradeFinder = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading, isError } = usePlayerSalaries();
  const { byId: values, isLoading: valuesLoading } = useTradeValues();
  const { data: scores = [] } = useWeeklyScores();
  const { data: schedule = emptySchedule } = useNflSchedule();
  const [selected, setSelected] = useState('');
  const [upgrade, setUpgrade] = useState('1');
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
  const team = league.find(t => t.id === selected);
  const suggestions = useMemo(() => team ? findTrades(team, league, startWeek, schedule, Number(upgrade)) : [], [team, league, startWeek, schedule, upgrade]);
  const loading = teamsLoading || salariesLoading || valuesLoading;
  return <Layout>
    <section className="border-b border-border">
      <div className="container mx-auto px-4 py-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-3xl font-bold text-primary">Trade Finder</h1>
          <div className="flex w-full items-end gap-3 sm:w-auto">
            <div className="min-w-0 flex-1 sm:w-72">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-team-label">Your team</label>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger aria-labelledby="finder-team-label"><SelectValue placeholder="Select a team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-32 shrink-0">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-upgrade-label">Value upgrade</label>
              <Select value={upgrade} onValueChange={setUpgrade}>
                <SelectTrigger aria-labelledby="finder-upgrade-label"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>+{v}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div className="container mx-auto min-h-[60vh] px-4 py-7">
      {selected && (loading ? <div className="flex items-center justify-center gap-3 py-20" role="status"><Loader2 className="h-5 w-5 animate-spin text-accent" />Finding trades…</div> : isError ? <p role="alert">Rosters could not be loaded. Please try again.</p> : !team?.roster.length ? <p className="text-muted-foreground">No active roster is available for this team.</p> : <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><FinderLogo key={team.id} name={team.name} /><h2 className="font-display text-xl font-semibold text-primary">{team.name}</h2></div>
          <p className="text-xs text-muted-foreground">{suggestions.length} opportunities · +{upgrade}% Trade Value target</p>
        </div>
        {!suggestions.length ? <p className="border-y border-border py-6 text-sm text-muted-foreground">No mutually beneficial trades match a +{upgrade}% Trade Value upgrade. Try another percentage or team.</p> : <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{suggestions.map((s, i) => {
          const params = new URLSearchParams({ teamA: team.id, teamB: s.partner.id, send: s.send.map(p => p.id).join(','), receive: s.receive.map(p => p.id).join(',') });
          const capWarning = team.roster.reduce((v, p) => v + p.salary, 0) + s.salaryChange > 1000 || s.partner.roster.reduce((v, p) => v + p.salary, 0) + s.partnerSalaryChange > 1000;
          return <article key={`${s.partner.id}-${i}`} className="flex min-w-0 flex-col rounded-md border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2"><FinderLogo name={s.partner.name} /><h3 className="min-w-0 text-sm font-semibold leading-tight text-primary">{s.partner.name}</h3></div>
            <p className="mb-4 border-b border-border pb-3 text-sm font-semibold text-win" data-value-upgrade={s.valueUpgrade}>+{num(s.valueUpgrade)}% Trade Value</p>
            <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Send · {num(s.valueSent)} TV</p>{s.send.map(p => <div key={p.id} className="mb-2"><p className="break-words text-sm font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></p><p className="text-xs text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</p></div>)}</div>
            <ArrowDown className="my-2 h-4 w-4 text-accent" aria-hidden="true" />
            <div className="mb-4"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Receive · {num(s.valueReceived)} TV</p>{s.receive.map(p => <div key={p.id} className="mb-2"><p className="break-words text-sm font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></p><p className="text-xs text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</p></div>)}</div>
            <div className="mb-4 space-y-3" data-trade-reason>
              <div><h4 className="mb-1 text-xs font-semibold text-primary">Why {team.name} should do it</h4><p className="break-words text-sm leading-relaxed text-muted-foreground">{tradeReason(team, s.send, s.receive, s.rosGain, s.depthGain)}</p></div>
              <div><h4 className="mb-1 text-xs font-semibold text-primary">Why {s.partner.name} should do it</h4><p className="break-words text-sm leading-relaxed text-muted-foreground">{tradeReason(s.partner, s.receive, s.send, s.partnerRosGain, s.partnerDepthGain)}</p></div>
            </div>
            <div className="mt-auto border-t border-border pt-3 text-xs">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">Your weekly gain</span><span className="font-semibold text-win">{signed(s.rosGain)} PPG</span></div>
              <div className="mt-1 flex justify-between gap-2"><span className="text-muted-foreground">Partner’s weekly gain</span><span className="font-semibold text-win">{signed(s.partnerRosGain)} PPG</span></div>
              {capWarning && <p className="mt-2 text-accent">2027 cap planning required</p>}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={`/trade-analyzer?${params}`}>Analyze trade<ArrowRight className="ml-2 h-3 w-3" /></Link></Button>
            </div>
          </article>;
        })}</div>}
        {suggestions.length > 0 && <p className="mt-4 text-xs text-muted-foreground">Received versus sent Trade Value · within 0.5 percentage points of +{upgrade}% · both rosters improve</p>}
      </>)}
    </div>
  </Layout>;
};
export default TradeFinder;
