import { useMemo } from 'react';
import { useTradeValues } from '@/hooks/useTradeValues';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { calculateDynastyRanks } from '@/lib/dynastyRanks';

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
                    <div className="text-[11px] text-muted-foreground">{t.keepers.length} keepers · {t.route}-player route{t.practiceSquad.length > 0 ? ` + ${t.practiceSquad.length} PS` : ''}</div>
                    <div className="truncate text-[11px] text-primary" title={t.keepers.map(p => p.name).join(', ')}>Keep: {t.keepers.map(p => p.name).join(', ')}</div>
                    {t.cut.length > 0 && (
                      <div className="truncate text-[11px] text-accent" title={t.cut.map((p) => p.name).join(', ')}>
                        Not kept: {t.cut.map((p) => p.name).join(', ')}
                      </div>
                    )}
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
