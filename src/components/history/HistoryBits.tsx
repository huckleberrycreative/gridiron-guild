import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { governor, type PlayoffResult } from '@/lib/leagueHistory';

export const fmt1 = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toFixed(1));
export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
export const record = (w: number, l: number, t: number) => (t ? `${w}-${l}-${t}` : `${w}-${l}`);

export function GovLink({ slug, className }: { slug: string; className?: string }) {
  const g = governor(slug);
  return (
    <Link to={`/meet-the-league/${slug}`} onClick={(e) => e.stopPropagation()} className={cn('font-semibold hover:text-accent hover:underline underline-offset-2', className)}>
      {g?.name ?? slug}
    </Link>
  );
}

const RESULT_STYLE: Record<PlayoffResult, string> = {
  Champion: 'bg-gold/20 text-gold border-gold/40',
  'Runner-Up': 'bg-primary/10 text-primary border-primary/30',
  Semifinalist: 'bg-secondary text-secondary-foreground border-border',
  Purgatory: 'bg-muted text-muted-foreground border-border',
  Missed: 'bg-transparent text-muted-foreground border-transparent',
};

export function ResultBadge({ result }: { result: PlayoffResult }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', RESULT_STYLE[result])}>
      {result === 'Missed' ? '—' : result}
    </span>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold leading-tight">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
