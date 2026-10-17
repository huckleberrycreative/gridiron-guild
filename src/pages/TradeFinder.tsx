import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Loader2, Search, ShieldCheck, Trophy, Sprout, Scale } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { getTeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerSalaries, useTeams } from '@/hooks/usePlayerSalaries';
import { useTradeValues } from '@/hooks/useTradeValues';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useActiveSeasonStandings } from '@/hooks/useLeagueData';
import { useNflSchedule, emptySchedule } from '@/hooks/useNflSchedule';
import { type StrategicTrade, type StrategyTeam, type TradeStrategy } from '@/lib/tradeFinderStrategy';

const num = (v: number) => v.toFixed(1);
const signed = (v: number) => `${v >= 0 ? '+' : ''}${num(v)}`;
const strategies = {
  'win-now': { label: 'Win Now', subtitle: 'All-in this year', Icon: Trophy },
  rebuild: { label: 'Rebuild', subtitle: 'Build for next year', Icon: Sprout },
  balanced: { label: 'Thread the Needle', subtitle: 'Compete now. Keep tomorrow.', Icon: Scale },
};
const strategyArgument = (s: StrategicTrade, own: boolean, strategy: TradeStrategy) => {
  const names = (own ? s.receive : s.send).map(p => p.name).join(' and ');
  const now = own ? s.currentOddsGain : s.partnerCurrentOddsGain;
  const future = own ? s.futureOddsGain : s.partnerFutureOddsGain;
  const savings = own ? s.futureSalarySaving : s.partnerFutureSalarySaving;
  const younger = own ? s.ageGain : s.partnerAgeGain;
  const variant = names.length % 3;
  const current = [
    `Make the push with ${names}: this deal lifts your championship chance by ${num(now)} percentage points this season.`,
    `${names} is a bet on winning the Shield now, with a modeled ${num(now)}-point increase in your title odds.`,
    `The reason to bring in ${names} is the trophy: your current title odds improve by ${num(now)} percentage points.`,
  ];
  if (strategy === 'win-now') return current[variant];
  const futureArgument = `${names} raises your estimated next-season title odds by ${num(future)} percentage points${younger > 0.05 ? ` while making the roster ${num(younger)} years younger on average` : ''}.`;
  const salaryArgument = savings > 0.05 ? ` The deal also frees up $${num(savings)} in average annual 2027–2029 salary.` : savings < -0.05 ? ` The added future strength costs $${num(-savings)} more in average annual salary.` : '';
  if (strategy === 'rebuild') return futureArgument + salaryArgument;
  return `${names} keeps the championship push alive: ${signed(now)} percentage points this year and ${signed(future)} in the next-season estimate.${salaryArgument}`;
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
  const { data: standings = [], isLoading: standingsLoading } = useActiveSeasonStandings();
  const { data: schedule = emptySchedule } = useNflSchedule();
  const [selected, setSelected] = useState('');
  const [upgrade, setUpgrade] = useState('1');
  const [strategy, setStrategy] = useState<TradeStrategy>('balanced');
  const [protectedIds, setProtectedIds] = useState<Set<string>>(new Set());
  const [submission, setSubmission] = useState<{ teamId: string; upgrade: number; playerIds: Set<string>; strategy: TradeStrategy } | null>(null);
  const [suggestions, setSuggestions] = useState<StrategicTrade[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const startWeek = Math.min(17, Math.max(0, ...scores.map(s => s.week)) + 1);
  const league = useMemo<StrategyTeam[]>(() => teams.map(team => {
    const seen = new Set<string>();
    const roster: StrategyTeam['roster'] = salaries.filter(p => p.teamId === team.id).flatMap(p => {
      const name = `${p.firstName} ${p.lastName}`.trim();
      const key = name.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) return [];
      seen.add(key);
      const tv = values.get(p.id);
      const ppg = p.actualPpg ?? tv?.ppg ?? p.espnProjPpg ?? 0;
      return [{ id: p.id, name, position: p.position, ppg, basePpg: ppg, projected: p.actualPpg == null, nflTeam: p.nflTeam, out: ['out', 'ir'].includes(p.injuryStatus), injuryStatus: p.injuryStatus, weeksOut: p.injuryWeeksOut, value: tv?.value ?? 0, salary: tv?.salary ?? 1, franchiseTag: p.franchiseTag, practiceSquad: p.practiceSquad, age: tv?.age, futurePpg: tv?.ppg, avgCost: tv?.avgCost }];
    });
    return { ...team, roster, accumulated: standings.find(t => t.id === team.id)?.totalPoints ?? 0 };
  }), [teams, salaries, values, standings]);
  const team = league.find(t => t.id === selected);
  useEffect(() => {
    setSuggestions([]);
    setSearchError('');
    if (!team || !submission || submission.teamId !== team.id) { setSearching(false); return; }
    const worker = new Worker(new URL('../lib/tradeFinder.worker.ts', import.meta.url), { type: 'module' });
    setSearching(true);
    worker.onmessage = (event: MessageEvent<{ suggestions?: StrategicTrade[]; error?: string }>) => {
      setSuggestions(event.data.suggestions ?? []);
      setSearchError(event.data.error ?? '');
      setSearching(false);
      worker.terminate();
    };
    worker.onerror = () => { setSearchError('Trade suggestions could not be calculated. Please submit again.'); setSearching(false); worker.terminate(); };
    worker.postMessage({ team, league, startWeek, schedule, target: submission.upgrade, ids: [...submission.playerIds], strategy: submission.strategy });
    return () => worker.terminate();
  }, [team, league, startWeek, schedule, submission]);
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
  const loading = teamsLoading || salariesLoading || valuesLoading || standingsLoading;
  return <Layout>
    <section className="border-b border-border bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-primary">Trade Finder</h1>
          <div className="flex items-center gap-2 text-primary"><Trophy className="h-5 w-5" /><span className="text-xs font-semibold uppercase">The next move</span></div>
        </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-team-label">Your team</label>
              <Select value={selected} onValueChange={changeTeam}>
                <SelectTrigger className="h-12 bg-background" aria-labelledby="finder-team-label"><SelectValue placeholder="Select a team" /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-upgrade-label">Value upgrade</label>
              <Select value={upgrade} onValueChange={value => { setUpgrade(value); setSubmission(null); }}>
                <SelectTrigger className="h-12 bg-background" aria-labelledby="finder-upgrade-label"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5].map(v => <SelectItem key={v} value={String(v)}>+{v}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground" id="finder-strategy-label">Your approach</label>
              <Select value={strategy} onValueChange={value => { if (value === 'win-now' || value === 'rebuild' || value === 'balanced') { setStrategy(value); setSubmission(null); } }}>
                <SelectTrigger className="h-12 bg-background" aria-labelledby="finder-strategy-label"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(strategies).map(([value, option]) => <SelectItem key={value} value={value}><span className="flex items-center gap-2"><option.Icon className="h-4 w-4" />{option.label}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        <div className="mt-5 flex items-center gap-2 text-sm text-primary">{(() => { const Icon = strategies[strategy].Icon; return <Icon className="h-4 w-4" />; })()}{strategies[strategy].subtitle}</div>
      </div>
    </section>
    <div className="container mx-auto px-4 py-7">
      {!selected && <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border pb-7 sm:grid-cols-5">{teams.map(t => <div key={t.id} className="flex min-w-0 items-center gap-3"><FinderLogo name={t.name} large /><p className="min-w-0 break-words text-xs font-semibold text-primary">{t.name}</p></div>)}</div>}
      {selected && (loading ? <div className="flex items-center justify-center gap-3 py-20" role="status"><Loader2 className="h-5 w-5 animate-spin text-accent" />Loading roster…</div> : isError ? <p role="alert">Rosters could not be loaded. Please try again.</p> : !team?.roster.length ? <p className="text-muted-foreground">No roster is available for this team.</p> : <>
        <form className="mb-7 border-b border-border pb-6" onSubmit={event => {
          event.preventDefault();
          setSubmission({ teamId: team.id, upgrade: Number(upgrade), playerIds: new Set(team.roster.filter(p => !protectedIds.has(p.id)).map(p => p.id)), strategy });
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
            <Button type="submit" disabled={!eligibleCount || searching}>{searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Submit</Button>
          </div>
        </form>
        {submission && (searching ? <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Comparing championship paths…</div> : searchError ? <p role="alert">{searchError}</p> : <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><FinderLogo key={team.id} name={team.name} /><h2 className="font-display text-xl font-semibold text-primary">{team.name}</h2></div>
          <p className="text-xs text-muted-foreground">{suggestions.length} opportunities · {strategies[strategy].label} · +{upgrade}% Trade Value target</p>
        </div>
        {!suggestions.length ? <p className="border-y border-border py-6 text-sm text-muted-foreground">No trades match your {strategies[strategy].label} approach and +{upgrade}% Trade Value target. Try another target, approach or player selection.</p> : <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{suggestions.map((s, i) => {
          const params = new URLSearchParams({ teamA: team.id, teamB: s.partner.id, send: s.send.map(p => p.id).join(','), receive: s.receive.map(p => p.id).join(',') });
          const capWarning = team.roster.reduce((v, p) => v + p.salary, 0) + s.salaryChange > 1000 || s.partner.roster.reduce((v, p) => v + p.salary, 0) + s.partnerSalaryChange > 1000;
          return <article key={`${s.partner.id}-${i}`} className="flex min-w-0 flex-col rounded-md border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2"><FinderLogo name={s.partner.name} /><h3 className="min-w-0 text-sm font-semibold leading-tight text-primary">{s.partner.name}</h3></div>
            <p className="mb-4 border-b border-border pb-3 text-sm font-semibold text-win" data-value-upgrade={s.valueUpgrade}>+{num(s.valueUpgrade)}% Trade Value</p>
            <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Send · {num(s.valueSent)} TV</p>{s.send.map(p => <div key={p.id} className="mb-2"><p className="break-words text-sm font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></p><p className="text-xs text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</p></div>)}</div>
            <ArrowDown className="my-2 h-4 w-4 text-accent" aria-hidden="true" />
            <div className="mb-4"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Receive · {num(s.valueReceived)} TV</p>{s.receive.map(p => <div key={p.id} className="mb-2"><p className="break-words text-sm font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">{p.position}</span></p><p className="text-xs text-muted-foreground">{num(p.value)} TV · ${num(p.salary)} in 2027</p></div>)}</div>
            <div className="mb-4 space-y-3" data-trade-reason>
              <div><h4 className="mb-1 text-xs font-semibold text-primary">Why {team.name} should do it</h4><p className="break-words text-sm leading-relaxed text-muted-foreground">{strategyArgument(s, true, strategy)}</p></div>
              <div><h4 className="mb-1 text-xs font-semibold text-primary">Why {s.partner.name} should do it</h4><p className="break-words text-sm leading-relaxed text-muted-foreground">{strategyArgument(s, false, s.partnerStrategy)}</p></div>
            </div>
            <div className="mt-auto border-t border-border pt-3 text-xs">
              {strategy !== 'rebuild' && <div className="flex justify-between gap-2"><span className="text-muted-foreground">2026 title odds</span><span className="font-semibold text-win">{signed(s.currentOddsGain)} pts</span></div>}
              {strategy !== 'win-now' && <div className="mt-1 flex justify-between gap-2"><span className="text-muted-foreground">2027 title estimate</span><span className="font-semibold text-win">{signed(s.futureOddsGain)} pts</span></div>}
              <div className="mt-1 flex justify-between gap-2"><span className="text-muted-foreground">Partner approach</span><span className="font-semibold">{strategies[s.partnerStrategy].label}</span></div>
              {strategy !== 'win-now' && capWarning && <p className="mt-2 text-accent">2027 cap planning required</p>}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={`/trade-analyzer?${params}`}>Analyze trade<ArrowRight className="ml-2 h-3 w-3" /></Link></Button>
            </div>
          </article>;
        })}</div>}
        {suggestions.length > 0 && <p className="mt-4 text-xs text-muted-foreground">Received versus sent Trade Value · within 0.5 percentage points of +{upgrade}% · each team benefits on its shown horizon</p>}
        {strategy !== 'win-now' && <p className="mt-3 text-xs text-muted-foreground">2027 estimates use age-adjusted player forecasts, a fresh season and current league rules; no 2027 NFL schedule or new draft/free-agent additions are included. Practice Squad players are assumed available for promotion.</p>}
        </>)}
      </>)}
    </div>
  </Layout>;
};
export default TradeFinder;
