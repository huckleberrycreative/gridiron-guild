import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, type Column } from '@/components/SortableTable';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

import { useTradeValues, type TradeValueRow as Row } from '@/hooks/useTradeValues';

const PRIME: Record<string, number> = { QB: 32, RB: 26, WR: 29, TE: 30 };
const ageFactor = (pos: string, age: number | null) => {
  if (!age || age <= PRIME[pos]) return 1;
  return Math.max(0.45, 1 - (age - PRIME[pos]) * (pos === 'RB' ? 0.09 : 0.08));
};

type SalaryRow = {
  id: string; name: string; position: string; team: string; ft?: boolean;
  s27: number; s28: number; s29: number; total: number; pts: number; ppd: number; ppg: number; rank: number; age: number | null; dynRank: number | null;
};

const TradeValueChart = () => {
  const { rows: all, isLoading } = useTradeValues();
  const [tab, setTab] = useState<'value' | 'salary'>('value');
  const [onlyFA, setOnlyFA] = useState(false);
  const [pos, setPos] = useState('ALL');
  const rows = useMemo(
    () => all
      .filter((r) => (onlyFA ? !r.teamId : !!r.teamId) && (pos === 'ALL' || r.group === pos))
      .map((r, i) => ({ ...r, rank: i + 1 })),
    [all, onlyFA, pos]
  );
  const salaryRows = useMemo<SalaryRow[]>(() => {
    return all
      .filter((r: any) => (onlyFA ? !r.teamId : !!r.teamId) && (pos === 'ALL' || r.group === pos) && r.ppg > 0)
      .map((r: any) => {
        const age = r.age as number | null;
        const avg = r.vor != null ? r.ppg - r.vor : r.ppg; // positional average
        const dyn = (r.dynScore ?? 0) / 100;
        const young = age != null && age <= 24;
        // Sustainability: the dynasty ranking reflects track record + outlook, so
        // hot starts from low-ranked players are discounted; elite assets hold value.
        const sustain = 0.45 + 0.55 * dyn;
        // Points over positional average across 2027–2029, aged each year,
        // with growth for young, highly-ranked players.
        const pts = [1, 2, 3].reduce((a, k) => {
          const growth = young ? 1 + dyn * 0.06 * k : 1;
          const ppgK = r.ppg * growth * ageFactor(r.position, age != null ? age + k : null);
          return a + Math.max(0, ppgK - avg) * 17 * sustain;
        }, 0);
        const total = r.s27 + r.s28 + r.s29;
        return { id: r.id, name: r.name, position: r.position, team: r.team, ft: r.ft, s27: r.s27, s28: r.s28, s29: r.s29, total, pts, ppd: total > 0 ? (pts / total) * 10 : 0, ppg: r.ppg, age, dynRank: r.dynastyRank, rank: 0 };
      })
      .sort((a, b) => b.ppd - a.ppd)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [all, onlyFA, pos]);

  const salaryColumns: Column<SalaryRow>[] = [
    { key: 'rank', label: '#', sortable: true, align: 'center' },
    { key: 'name', label: 'Player', sortable: true, render: (v, row) => (
      <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold min-w-[12rem]">
        {String(v)}
        {row.ft && <span title="Franchise tag" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent text-[10px] font-bold leading-none text-accent-foreground">F</span>}
      </span>
    ) },
    { key: 'position', label: 'Pos', sortable: true, align: 'center' },
    { key: 'team', label: 'Team', sortable: true },
    { key: 'ppd', label: 'Value per $10', sortable: true, align: 'center', render: (v) => (
      <span className="inline-block min-w-[3rem] rounded bg-primary/10 px-2 py-1 font-bold text-primary">{Number(v).toFixed(1)}</span>
    ) },
    { key: 'ppg', label: 'Proj PPG', sortable: true, align: 'center', render: (v) => Number(v).toFixed(1) },
    { key: 'age', label: 'Age', sortable: true, align: 'center', render: (v) => (v ?? '—') as string },
    { key: 'dynRank', label: 'Dyn Rk', sortable: true, align: 'center', render: (v) => (v ?? '—') as string },
    { key: 'pts', label: 'Pts Over Avg (27–29)', sortable: true, align: 'center', render: (v) => Math.round(Number(v)).toLocaleString() },
    { key: 's27', label: '2027 $', sortable: true, align: 'center', render: (v) => `$${v}` },
    { key: 's28', label: '2028 $', sortable: true, align: 'center', render: (v) => `$${v}` },
    { key: 's29', label: '2029 $', sortable: true, align: 'center', render: (v) => `$${v}` },
    { key: 'total', label: '3-Yr $', sortable: true, align: 'center', render: (v) => `$${v}` },
  ];

  const columns: Column<Row & { rank: number }>[] = [
    { key: 'rank', label: '#', sortable: true, align: 'center' },
    { key: 'name', label: 'Player', sortable: true, render: (v, row) => (
      <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold min-w-[12rem]">
        {String(v)}
        {(row as { ft?: boolean }).ft && (
          <span title="Franchise tag" className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-700 text-[10px] font-bold leading-none text-white">F</span>
        )}
      </span>
    ) },
    { key: 'position', label: 'Pos', sortable: true, align: 'center' },
    { key: 'team', label: 'Team', sortable: true },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      align: 'center',
      render: (v) => {
        const n = Number(v);
        return (
          <span
            className={cn(
              'inline-block min-w-[3rem] rounded px-2 py-1 font-bold',
              n >= 75 ? 'bg-emerald-100 text-emerald-900' : n >= 50 ? 'bg-lime-100 text-lime-900' : n >= 25 ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-600'
            )}
          >
            {n}
          </span>
        );
      },
    },
    { key: 'age', label: 'Age', sortable: true, align: 'center', render: (v) => (v ?? '—') as string },
    { key: 'ppg', label: 'Proj PPG', sortable: true, align: 'center', render: (v) => (Number(v) ? Number(v).toFixed(1) : '—') },
    { key: 'vor', label: 'VOR', sortable: true, align: 'center', render: (v) => (v == null ? '—' : `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}`) },
    {
      key: 'surplus',
      label: 'Surplus $',
      sortable: true,
      align: 'center',
      render: (v) => {
        const n = Number(v);
        return (
          <span className={cn('font-semibold', n > 0 ? 'text-emerald-700' : n < 0 ? 'text-red-700' : 'text-muted-foreground')}>
            {n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(Math.round(n))}
          </span>
        );
      },
    },
    { key: 'rosRank', label: 'ROS Rk', sortable: true, align: 'center', render: (v) => (v ?? '—') as string },
    { key: 'salary', label: '2027 $', sortable: true, align: 'center', render: (v) => `$${v}` },
    { key: 'avgCost', label: 'Wtd $ (27–29)', sortable: true, align: 'center', render: (v) => `$${Math.round(Number(v))}` },
  ];

  return (
    <Layout>
      <div className="bg-primary py-14 text-primary-foreground">
        <div className="container mx-auto px-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] opacity-60">Dynasty Information</p>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">Trade Value Chart</h1>
          <p className="mt-3 max-w-3xl opacity-80">
            Every player graded 0–100 on true value: what he produces now, what he'll be worth in future
            seasons, and what he costs against the cap. A cheap riser beats an expensive veteran of similar talent.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="mb-6 grid gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 font-semibold text-primary">Proj PPG — what he&apos;ll average</p>
            <p className="text-muted-foreground">
              His expected points per game for the full season. We start with what the experts picked him for, then
              nudge it up if he&apos;s been scoring better than expected. A slow start by a proven veteran doesn&apos;t
              hurt him much yet.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 font-semibold text-primary">VOR, Surplus &amp; Cost — is he worth it?</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">VOR</span> — points per game more than a throwaway
                starter would give you.
              </li>
              <li>
                <span className="font-semibold text-foreground">Surplus $</span> — what those extra points are worth,
                minus his salary. Green is a bargain, red is overpaying.
              </li>
              <li>
                <span className="font-semibold text-foreground">Wtd $</span> — his average yearly cost over the next
                three seasons, counting 2027 the most.
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-1 font-semibold text-primary">Value — his final grade, 0 to 100</p>
            <p className="text-muted-foreground">
              Mostly about being cheap and productive, with a little credit for upside and raw scoring. Young and
              affordable goes up; old, expensive or franchise-tagged goes down. QBs, RBs and Pass Catchers are each
              graded on their own scale, so every group has a 100.
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-1 border-b border-border">
          {([['value', 'Trade Value'], ['salary', 'Best Salaries']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-semibold', tab === t ? 'border-accent text-primary' : 'border-transparent text-muted-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'salary' && (
          <p className="mb-4 text-sm text-muted-foreground">
            Best bang for the buck over 2027–2029: points scored above the average starter at his position, each year,
            per $10 of salary. Older players fade, young high-ranked players grow, and hot starts from low-ranked
            players are discounted unless their dynasty ranking backs them up.
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[['ALL', 'All'], ['QB', 'QB'], ['RB', 'RB'], ['PC', 'Pass Catchers']].map(([p, label]) => (
            <button
              key={p}
              onClick={() => setPos(p)}
              className={cn('rounded-md border px-3 py-1.5 text-sm font-semibold', pos === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card')}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setOnlyFA((v) => !v)}
            title="Show only players on waivers"
            aria-pressed={onlyFA}
            className={cn(
              'ml-auto rounded-md border px-3 py-1.5 text-sm font-semibold',
              onlyFA ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-card'
            )}
          >
            {onlyFA ? 'Showing waivers only' : 'Isolate FAs'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : tab === 'salary' ? (
          <SortableTable data={salaryRows} columns={salaryColumns} />
        ) : (
          <SortableTable data={rows as (Row & { rank: number })[]} columns={columns} />
        )}
      </div>
    </Layout>
  );
};

export default TradeValueChart;
