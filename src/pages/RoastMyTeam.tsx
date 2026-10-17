import { useMemo, useState } from 'react';
import { Flame, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { getTeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveSeasonStandings } from '@/hooks/useLeagueData';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePowerRankRows } from '@/hooks/usePowerRanks';
import { useTradeValues } from '@/hooks/useTradeValues';
import { calculateDynastyRanks } from '@/lib/dynastyRanks';
import { buildTeamRoast } from '@/lib/teamRoast';
import leagueShield from '@/assets/shield.png';

function RoastLogo({name}: {name:string}) {
  const [failed,setFailed]=useState(false);
  const url=getTeamLogo(name);
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-secondary font-display font-bold text-primary">
    {url && !failed ? <img src={url} alt={`${name} logo`} className="h-full w-full object-contain" onError={()=>setFailed(true)} /> : name.split(' ').map(word=>word[0]).join('').slice(0,2)}
  </span>;
}

export default function RoastMyTeam() {
  const [selected, setSelected] = useState('');
  const { data: standings = [], isLoading: standingsLoading, isError: standingsError } = useActiveSeasonStandings();
  const { data: salaries = [], isLoading: salariesLoading, isError: salaryError } = usePlayerSalaries();
  const { rows: power, loading: powerLoading, weeksPlayed, schedule, scheduleError } = usePowerRankRows('actual');
  const { rows: values, isLoading: valuesLoading } = useTradeValues();
  const dynasty = useMemo(() => calculateDynastyRanks(values), [values]);
  const report = useMemo(() => selected ? buildTeamRoast(selected,standings,power,dynasty,values,salaries,schedule,weeksPlayed) : null,
    [selected,standings,power,dynasty,values,salaries,schedule,weeksPlayed]);
  const loading = standingsLoading || salariesLoading || powerLoading || valuesLoading;
  const error = standingsError || salaryError;
  return <Layout>
    <section className="border-b border-border bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-accent"><Flame className="h-4 w-4" />The front office reckoning</div>
            <h1 className="font-display text-3xl font-bold text-primary md:text-4xl">Roast My Team</h1>
            <p className="mt-2 text-sm text-muted-foreground">No personal shots. No participation trophies.</p>
          </div>
          <img src={leagueShield} alt="Men’s League Shield" className="h-16 w-16 shrink-0 object-contain" />
        </div>
        <div className="max-w-xl">
          <label id="roast-team-label" className="mb-2 block text-xs font-semibold text-muted-foreground">Your team</label>
          <Select value={selected} onValueChange={setSelected} disabled={standingsLoading}>
            <SelectTrigger className="h-12 bg-background" aria-labelledby="roast-team-label"><SelectValue placeholder="Select a team" /></SelectTrigger>
            <SelectContent>{[...standings].sort((a,b)=>a.name.localeCompare(b.name)).map(t=><SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </section>
    <main className="container mx-auto px-4 py-10" aria-live="polite">
      {error ? <p role="alert" className="text-accent">The league data could not be loaded. Refresh this page to try again.</p> : loading ? <div className="flex items-center gap-3 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Reading the league…</div> : !selected ?
        <div className="flex flex-wrap items-center justify-center gap-5 border-b border-border pb-10 pt-4">
          {standings.map(t=><Button key={t.id} variant="ghost" className="h-20 w-20 p-2" onClick={()=>setSelected(t.id)} aria-label={`Roast ${t.name}`} title={t.name}><RoastLogo name={t.name} /></Button>)}
        </div> : !report ? <p className="text-muted-foreground">There is not enough roster and ranking data to give this team an honest assessment yet.</p> :
        <article className="mx-auto max-w-4xl" key={selected}>
          <header className="mb-8 flex items-center gap-4 border-b border-border pb-6">
            <RoastLogo key={report.name} name={report.name} />
            <div className="min-w-0"><p className="mb-1 text-xs font-semibold uppercase text-accent">The verdict · through Week {weeksPlayed}</p><h2 className="font-display text-2xl font-bold text-primary break-words">{report.name}</h2></div>
          </header>
          {[
            {number:'01',title:'Your current standings',text:report.currentText},
            {number:'02',title:'Your dynasty reality check',text:report.dynastyText},
            {number:'03',title:'How this season ends',text:report.forecastText},
          ].map(section=><section key={section.number} className="mb-8 border-b border-border pb-8">
            <div className="mb-3 flex items-baseline gap-3"><span className="font-display text-xl font-bold text-accent">{section.number}</span><h3 className="font-display text-xl font-bold text-primary">{section.title}</h3></div>
            <p className="text-base leading-8 text-foreground">{section.text}</p>
          </section>)}
          <section>
            <div className="mb-6 flex items-baseline gap-3"><span className="font-display text-xl font-bold text-accent">04</span><h3 className="font-display text-xl font-bold text-primary">The five-step turnaround plan</h3></div>
            <ol className="space-y-7">
              {report.steps.map((step,i)=><li key={step.title} className="border-l-2 border-accent pl-5"><h4 className="mb-2 font-display text-lg font-bold text-primary">{i+1}. {step.title}</h4><p className="leading-8 text-foreground">{step.body}</p></li>)}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3"><Button variant="accent" asChild><Link to="/trade-finder">Find a trade <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="outline" asChild><Link to="/waiver-wire">Waiver Wire <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div>
          </section>
          <footer className="mt-10 border-t border-border pt-5 text-xs leading-6 text-muted-foreground">
            The Week 13 finish is an approximate expected-points ordering using earned points, actual player averages, saved injuries, byes and weekly scoring variance; it is separate from the simulated playoff and title probabilities. Projection fallbacks apply only where actual player averages are missing. Dynasty forecasts use age-adjusted projections, 2027 salaries and hypothetical cap cuts; unknown next-season schedules and future acquisitions are not included. Injury probabilities and scoring volatility are modeling assumptions, not verified individual forecasts. {scheduleError ? 'Opponent data is unavailable; matchup effects are neutral.' : 'Opponent adjustments use scoring allowed, not ESPN position-specific OPRK; cached schedule data may be used.'} No finish or path to #1 is guaranteed.
          </footer>
        </article>}
    </main>
  </Layout>;
}