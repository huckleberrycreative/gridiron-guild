import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Loader2, Search, ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { getTeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const after = [...team.roster.filter(p => !outgoingIds.has(p.id) && !p.practiceSquad), ...incoming];
  const starterIds = new Set(bestLineup(healthyRoster(after)).map(p => p.id));
  const additions = incoming.map(p => `${p.name}${p.position === 'TE' ? ' (FLEX)' : ''}`).join(' and ');
  const starters = incoming.filter(p => starterIds.has(p.id));
  const beforeIds = new Set(bestLineup(healthyRoster(team.roster.filter(p => !p.practiceSquad))).map(p => p.id));
  const sparePlayers = outgoing.filter(p => !beforeIds.has(p.id)).map(p => p.name).join(' and ');
  const sentNames = outgoing.map(p => p.name).join(' and ');
  const starterNames = starters.map(p => p.name).join(' and ');
  const variant = [...team.id + incoming.map(p => p.id).join('')].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4;
  const pick = (options: string[]) => options[variant] ?? options[0] ?? '';
  const saving = outgoing.reduce((sum, p) => sum + p.salary, 0) - incoming.reduce((sum, p) => sum + p.salary, 0);
  let argument: string;
  if (scoringGain < 0.05) {
    argument = pick([
      `${additions} makes an injury less costly: replacement scoring improves by ${num(coverGain)} points without a meaningful drop in weekly output.`,
      `The case for ${additions} is insurance rather than extra points today—this swap improves injury cover by ${num(coverGain)} points while preserving expected scoring.`,
      `Giving up ${sentNames} buys a stronger safety net in ${additions}, worth ${num(coverGain)} more points when a starter is missing.`,
      `Take ${additions} to protect the lineup rather than chase a tiny scoring gain; the return improves injury-replacement output by ${num(coverGain)} points.`,
    ]);
  } else if (sparePlayers && starters.length) {
    argument = pick([
      `Put spare depth to work: ${sparePlayers} leaves the bench, while ${starterNames} earns a place in your starting lineup for an expected ${num(scoringGain)} extra points per week.`,
      `${starterNames} turns depth into usable scoring; moving ${sparePlayers} helps fund a starting-lineup addition worth about ${num(scoringGain)} points per week.`,
      `The appeal is getting more out of your roster: trade away bench option ${sparePlayers} and bring in ${starterNames} to raise expected weekly scoring by ${num(scoringGain)} points.`,
      `This gives ${starterNames} a starting role instead of leaving value tied up in ${sparePlayers} on the bench, with a modeled ${num(scoringGain)}-point weekly lift.`,
    ]);
  } else if (starters.length) {
    argument = pick([
      `${starterNames} belongs in your starting lineup after this deal, making the swap of ${sentNames} worthwhile for an expected ${num(scoringGain)}-point weekly gain.`,
      `Back this deal for the lineup change: ${starterNames} steps into a starting spot and lifts expected scoring by ${num(scoringGain)} points per week.`,
      `Accepting ${additions} gives you a better-scoring lineup despite losing ${sentNames}; the expected improvement is ${num(scoringGain)} points per week.`,
      `The reason to move ${sentNames} is the return: ${starterNames} can start for you, adding roughly ${num(scoringGain)} points to weekly output.`,
    ]);
  } else {
    argument = pick([
      `${additions} gives you more ways to handle missing starters, with the remaining schedule showing an expected ${num(scoringGain)}-point weekly benefit.`,
      `You do not need ${additions} to start every week for this to pay off; the extra options improve scheduled scoring by ${num(scoringGain)} points per week.`,
      `Move ${sentNames} for a more useful set of alternatives in ${additions}, worth an expected ${num(scoringGain)} extra points per week across the remaining schedule.`,
      `This is a flexibility play: ${additions} can fill lineup gaps, and the scheduled scoring gain is about ${num(scoringGain)} points per week.`,
    ]);
  }
  if (saving >= 0.1) return `${argument} It also frees up $${num(saving)} in 2027 salary.`;
  if (scoringGain >= 0.05 && coverGain >= 0.5) return `${argument} There is a safety-net benefit too: ${num(coverGain)} more points of injury cover.`;
  return argument;
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
  const [protectedIds, setProtectedIds] = useState<Set<string>>(new Set());
  const [submission, setSubmission] = useState<{ teamId: string; upgrade: number; playerIds: Set<string> } | null>(null);
  const startWeek = Math.min(17, Math.max(0, ...scores.map(s => s.week)) + 1);
  const league = useMemo<FinderTeam[]>(() => teams.map(team => {
    const seen = new Set<string>();
    const roster: FinderPlayer[] = salaries.filter(p => p.teamId === team.id).flatMap(p => {
      const name = `${p.firstName} ${p.lastName}`.trim();
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) return [];
      seen.add(key);
      const tv = values.get(p.id);
      const ppg = p.actualPpg ?? tv?.ppg ?? p.espnProjPpg ?? 0;
      return [{ id: p.id, name, position: p.position, ppg, basePpg: ppg, projected: p.actualPpg == null, nflTeam: p.nflTeam, out: ['out', 'ir'].includes(p.injuryStatus), injuryStatus: p.injuryStatus, weeksOut: p.injuryWeeksOut, value: tv?.value ?? 0, salary: tv?.salary ?? 1, franchiseTag: p.franchiseTag, practiceSquad: p.practiceSquad }];
    });
    return { ...team, roster };
  }), [teams, salaries, values]);
  const team = league.find(t => t.id === selected);
  const suggestions = useMemo(() => team && submission?.teamId === team.id ? findTrades(team, league, startWeek, schedule, submission.upgrade, submission.playerIds) : [], [team, league, startWeek, schedule, submission]);
  const changeTeam = (id: string) => {
    setSelected(id);
    setProtectedIds(new Set());
    setSubmission(null);
  };
  const togglePlayer = (id: string, checked: boolean) => {
    setProtectedIds(previous => {
      const next = new Set(previous);
      if (checked) next.delete(id); else next.add(id);
      return next;
    });
    setSubmission(null);
  };
  const eligibleCount = team?.roster.filter(p => !protectedIds.has(p.id)).length ?? 0;
  const loading = teamsLoading || salariesLoading || valuesLoading;
  return <Layout>
    <section className="border-b border-border">
      <div className="container mx-auto px-4 py-7">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-3xl font-bold text-primary">Trade Finder</h1>
          <div className="flex w-full items-end gap-3 sm:w-auto">
            <div className="min-w-0 flex-1 sm:w-72">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-team-label">Your team</label>
              <Select value={selected} onValueChange={changeTeam}>
                <SelectTrigger aria-labelledby="finder-team-label"><SelectValue placeholder="Select a team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-32 shrink-0">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-upgrade-label">Value upgrade</label>
              <Select value={upgrade} onValueChange={value => { setUpgrade(value); setSubmission(null); }}>
                <SelectTrigger aria-labelledby="finder-upgrade-label"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>+{v}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </section>
    <div className="container mx-auto min-h-[60vh] px-4 py-7">
      {selected && (loading ? <div className="flex items-center justify-center gap-3 py-20" role="status"><Loader2 className="h-5 w-5 animate-spin text-accent" />Loading roster…</div> : isError ? <p role="alert">Rosters could not be loaded. Please try again.</p> : !team?.roster.length ? <p className="text-muted-foreground">No roster is available for this team.</p> : <>
        <form className="mb-7 border-b border-border pb-6" onSubmit={event => {
          event.preventDefault();
          setSubmission({ teamId: team.id, upgrade: Number(upgrade), playerIds: new Set(team.roster.filter(p => !protectedIds.has(p.id)).map(p => p.id)) });
        }}>
          <div className="mb-5 flex items-center gap-3"><FinderLogo key={team.id} name={team.name} /><h2 className="font-display text-xl font-semibold text-primary">Players available to trade</h2></div>
          <div className="space-y-5">{[{ label: 'Roster', practiceSquad: false }, { label: 'Practice Squad', practiceSquad: true }].map(group => {
            const players = team.roster.filter(p => Boolean(p.practiceSquad) === group.practiceSquad);
            return <fieldset key={group.label}>
              <legend className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{group.label} · {players.length}</legend>
              {players.length ? <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{players.map(player => <label key={player.id} className="flex min-w-0 cursor-pointer items-center gap-3 rounded py-2">
                <Checkbox aria-label={player.name} checked={!protectedIds.has(player.id)} onCheckedChange={checked => togglePlayer(player.id, checked === true)} />
                <span className="min-w-0 break-words text-sm font-medium">{player.name} <span className="text-xs font-normal text-muted-foreground">{player.position}</span></span>
              </label>)}</div> : <p className="text-sm text-muted-foreground">No Practice Squad players.</p>}
            </fieldset>;
          })}</div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{eligibleCount} available · {team.roster.length - eligibleCount} protected</p>
            <Button type="submit" disabled={!eligibleCount}><Search className="mr-2 h-4 w-4" />Submit</Button>
          </div>
        </form>
        {submission && <>
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
        </>}
      </>)}
    </div>
  </Layout>;
};
export default TradeFinder;
