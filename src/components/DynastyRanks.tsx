import { useMemo } from 'react';
import { useTradeValues } from '@/hooks/useTradeValues';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { calculateDynastyRanks, coreWeeklyComparison } from '@/lib/dynastyRanks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DynastyRanks() {
  const { rows, isLoading } = useTradeValues();

  const teams = useMemo(() => calculateDynastyRanks(rows), [rows]);

  if (isLoading) return <p className="py-12 text-center text-muted-foreground">Loading…</p>;
  const pct = (v: number) => (v >= 99.5 ? '>99%' : v < 0.5 && v > 0 ? '<1%' : `${Math.round(v)}%`);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[880px] table-fixed text-sm">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="w-12 px-2 py-3 text-left">#</th>
            <th className="w-[26%] px-2 py-3 text-left">Team</th>
            <th className="px-2 py-3">Dynasty Grade</th>
            <th className="px-2 py-3">Keeper PPW</th>
            <th className="px-2 py-3">Keeper Payroll</th>
            <th className="px-2 py-3">Draft Budget</th>
            <th className="px-2 py-3">Playoff Odds</th>
            <th className="px-2 py-3">2027 Title Odds</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.id} className={cn('border-t border-border', i % 2 === 1 && 'bg-muted/40')}>
              <td className="px-2 py-3 font-serif font-bold">{i + 1}</td>
              <td className="px-2 py-3">
                <div className="flex items-center gap-2">
                  <TeamLogo teamName={t.name} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate font-serif font-semibold text-primary">{t.name}</div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="h-7 px-0 text-[11px]" aria-label={`Optimized Rosters — ${t.name}`}>Optimized Rosters</Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[85vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="pr-6 font-serif">{t.name}</DialogTitle>
                          <DialogDescription>2027 optimized core · {t.keepers.length} keepers · {t.route}-player route{t.practiceSquad.length ? ` · ${t.practiceSquad.length} exempt Practice Squad` : ''}</DialogDescription>
                        </DialogHeader>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-3 text-sm">
                          <div><dt className="text-muted-foreground">Total salary allocation</dt><dd className="font-semibold tabular-nums">${t.committed.toFixed(1)} / $1,000.0</dd></div>
                          <div><dt className="text-muted-foreground">Weekly points above average</dt><dd className={cn('font-semibold tabular-nums', coreWeeklyComparison(t.ppw, teams).aboveAverage < 0 ? 'text-destructive' : 'text-primary')}>{coreWeeklyComparison(t.ppw, teams).aboveAverage >= 0 ? '+' : ''}{coreWeeklyComparison(t.ppw, teams).aboveAverage.toFixed(1)} pts/wk</dd></div>
                          <div><dt className="text-muted-foreground">Core weekly points</dt><dd className="tabular-nums">{t.ppw.toFixed(1)}</dd></div>
                          <div><dt className="text-muted-foreground">League average core</dt><dd className="tabular-nums">{coreWeeklyComparison(t.ppw, teams).average.toFixed(1)} pts/wk</dd></div>
                        </dl>
                        <table className="w-full text-sm">
                          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="pb-2">Player</th><th className="pb-2">Pos</th><th className="pb-2 text-right">2027 salary</th><th className="pb-2 text-right">Proj PPW</th></tr></thead>
                          <tbody>{[...t.keepers, ...t.practiceSquad].map(p => (
                            <tr key={p.id} className="border-b border-border">
                              <td className="py-2 pr-2">{p.name}{p.practiceSquad && <span className="block text-[11px] text-muted-foreground">Practice Squad · exempt</span>}</td>
                              <td className="py-2 text-muted-foreground">{p.position}</td>
                              <td className="py-2 text-right tabular-nums">${p.s27.toFixed(1)}</td>
                              <td className="py-2 text-right tabular-nums">{p.ppg.toFixed(1)}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                        <p className="text-xs text-muted-foreground">Weekly comparison uses the legal starting-lineup output of each team's optimized core, including available Practice Squad players. Practice Squad salaries do not count toward allocation.</p>
                        {t.luxuryTax && <p className="text-sm text-destructive">Luxury tax: 50% additional dues · $9.0 draft budget</p>}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 text-center font-serif text-2xl font-bold text-accent">{t.grade}</td>
              <td className="px-2 py-3 text-center tabular-nums">{t.ppw.toFixed(1)}</td>
              <td className="px-2 py-3 text-center tabular-nums">${t.payroll.toFixed(1)}{t.luxuryTax && <div className="text-[10px] text-destructive">Luxury tax · 50% dues</div>}</td>
              <td className={cn('px-2 py-3 text-center tabular-nums', t.space < 0 && 'text-accent')}>${t.draftBudget.toFixed(1)}</td>
              <td className="px-2 py-3 text-center tabular-nums">{pct(t.playoff)}</td>
              <td className="px-2 py-3 text-center font-semibold tabular-nums text-primary">{pct(t.champ)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
