import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Play, Trophy } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePowerRankRows } from '@/hooks/usePowerRanks';
import { getTeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { PLAYOFF_WEEKS, simulatePlayoffs, type PlayoffEntry, type PlayoffResult } from '@/lib/playoffSimulator';

const RULE_LABEL = { best: 'Best of Wk 14/15', average: 'Average of Wk 14/15', lowest: 'Lowest of Wk 14/15' } as const;

function Logo({ name, size = 'h-8 w-8' }: { name: string; size?: string }) {
  const src = getTeamLogo(name);
  return src ? <img src={src} alt="" className={cn(size, 'object-contain shrink-0')} /> : <div className={cn(size, 'rounded-full bg-muted shrink-0')} />;
}

function Reel({ week, state }: { week: number; state: 'idle' | 'spinning' | 'done' }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (state !== 'spinning') return;
    const t = setInterval(() => setTick(x => x + 1), 70);
    return () => clearInterval(t);
  }, [state]);
  const label = state === 'spinning' ? `Week ${PLAYOFF_WEEKS[tick % 4]}` : `Week ${week}`;
  return (
    <div className={cn('relative h-24 w-full overflow-hidden rounded-lg border-4 flex items-center justify-center font-display text-xl md:text-2xl font-bold transition-colors',
      state === 'done' ? 'border-green-600 bg-green-50 text-green-700' : 'border-primary bg-card text-foreground')}>
      <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-foreground/15 to-transparent" />
      <span key={tick} className={cn(state === 'spinning' && 'animate-in slide-in-from-top-6 duration-75 blur-[1px]')}>{state === 'idle' ? '?' : label}</span>
      <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-foreground/15 to-transparent" />
    </div>
  );
}

function SemiCard({ e }: { e: PlayoffEntry }) {
  return (
    <div className={cn('rounded-lg border-2 p-3 text-sm', e.advanced ? 'border-green-600 bg-green-50' : 'border-destructive/40 bg-destructive/5')}>
      <div className="flex items-center gap-2"><span className="text-xs font-bold text-muted-foreground">#{e.seed}</span><Logo name={e.team.name} size="h-6 w-6" /><span className="font-semibold truncate">{e.team.name}</span></div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Wk 14: {e.weeks[14].score.toFixed(1)}</span><span>Wk 15: {e.weeks[15].score.toFixed(1)}</span></div>
      <div className="mt-1 text-xs text-muted-foreground">{RULE_LABEL[e.semiRule]}</div>
      <div className="mt-1 text-2xl font-bold">{e.semiScore.toFixed(1)}</div>
      <div className={cn('text-xs font-bold uppercase', e.advanced ? 'text-green-700' : 'text-destructive')}>{e.advanced ? 'Advances' : 'Eliminated'}</div>
    </div>
  );
}

export default function PlayoffSimulator() {
  const { rows, loading, schedule } = usePowerRankRows('actual');
  const ranked = useMemo(() => [...rows].sort((a, b) => b.team.totalPoints - a.team.totalPoints), [rows]);
  const [seeds, setSeeds] = useState<string[]>([]);
  useEffect(() => { if (!seeds.length && ranked.length >= 5) setSeeds(ranked.slice(0, 5).map(r => r.team.id)); }, [ranked, seeds.length]);
  const [reels, setReels] = useState<('idle' | 'spinning' | 'done')[]>(['idle', 'idle', 'idle', 'idle']);
  const [result, setResult] = useState<PlayoffResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const duplicate = new Set(seeds).size !== seeds.length;
  const spinning = reels.includes('spinning');

  const run = () => {
    const teams = seeds.map(id => rows.find(r => r.team.id === id)!).map(r => ({ id: r.team.id, name: r.team.name, roster: r.roster }));
    setResult(simulatePlayoffs(teams, schedule, `${seeds.join('|')}:${Date.now()}`));
    setShowResult(false);
    timers.current.forEach(clearTimeout);
    setReels(['spinning', 'spinning', 'spinning', 'spinning']);
    [0, 1, 2, 3].forEach(i => timers.current.push(window.setTimeout(() => setReels(r => r.map((s, j) => (j === i ? 'done' : s))), 1200 + i * 650)));
    timers.current.push(window.setTimeout(() => setShowResult(true), 1200 + 3 * 650 + 300));
  };

  const finalists = result?.entries.filter(e => e.advanced).sort((a, b) => a.seed - b.seed) ?? [];
  const champ = result?.entries.find(e => e.champion);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <h1 className="font-display text-4xl font-bold text-primary">Playoff Simulator</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">Spin a full Weeks 14–17 playoff run built on current rosters, byes, injuries and matchups. Seeds 1–2 keep their best Week 14/15 score, seeds 3–4 average them, and seed 5 keeps the lowest. The top two advance to a two-week championship.</p>

        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border bg-card p-6">
          <Button size="lg" onClick={run} disabled={loading || seeds.length < 5 || duplicate || spinning} className="px-10 text-lg">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}Run Simulation
          </Button>
          <div className="grid w-full max-w-3xl grid-cols-4 gap-3">
            {PLAYOFF_WEEKS.map((w, i) => <Reel key={w} week={w} state={reels[i]} />)}
          </div>
        </div>

        <h2 className="mt-8 font-display text-2xl font-bold">Playoff Seeds</h2>
        <p className="text-sm text-muted-foreground">Defaults to the current top five in the standings. Swap in any team.</p>
        {duplicate && <p className="text-sm text-destructive mt-1">Each team can only hold one seed.</p>}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border p-3">
              <div className="text-xs font-bold text-muted-foreground mb-1">#{i + 1} seed · {RULE_LABEL[i < 2 ? 'best' : i < 4 ? 'average' : 'lowest']}</div>
              <Select value={seeds[i]} onValueChange={v => setSeeds(s => s.map((x, j) => (j === i ? v : x)))} disabled={spinning}>
                <SelectTrigger><SelectValue placeholder="Pick team" /></SelectTrigger>
                <SelectContent>{ranked.map(r => <SelectItem key={r.team.id} value={r.team.id}>{r.team.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {result && showResult && champ && (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="font-display text-2xl font-bold">Semifinal Round · Weeks 14–15</h2>
            <p className="text-sm text-muted-foreground">Top two scores advance.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{result.entries.map(e => <SemiCard key={e.team.id} e={e} />)}</div>

            <h2 className="mt-8 font-display text-2xl font-bold">Championship · Weeks 16–17</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {finalists.map(e => (
                <div key={e.team.id} className={cn('rounded-lg border-2 p-4', e.champion ? 'border-green-600 bg-green-50' : 'border-border')}>
                  <div className="flex items-center gap-3"><Logo name={e.team.name} /><div className="font-semibold">#{e.seed} {e.team.name}</div>{e.champion && <Trophy className="ml-auto h-5 w-5 text-green-700" />}</div>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground"><span>Wk 16: {e.weeks[16].score.toFixed(1)}</span><span>Wk 17: {e.weeks[17].score.toFixed(1)}</span></div>
                  <div className="text-3xl font-bold mt-1">{e.finalScore?.toFixed(1)}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-primary p-6 text-center text-primary-foreground">
              <Trophy className="mx-auto h-10 w-10" />
              <div className="mt-2 text-sm uppercase tracking-widest opacity-80">Champion</div>
              <div className="flex items-center justify-center gap-3 mt-1"><Logo name={champ.team.name} size="h-10 w-10" /><span className="font-display text-3xl font-bold">{champ.team.name}</span></div>
            </div>

            <h2 className="mt-8 font-display text-2xl font-bold">How It Played Out</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[...result.entries].sort((a, b) => a.seed - b.seed).map(e => (
                <div key={e.team.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 font-semibold"><Logo name={e.team.name} size="h-6 w-6" />#{e.seed} {e.team.name}</div>
                  <p className="mt-2 text-sm leading-relaxed">{e.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
