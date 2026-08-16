import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useTeams, usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Loader2, Star, CalendarClock } from 'lucide-react';

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};

const POS_ORDER: Record<string, number> = { QB: 1, RB: 2, WR: 3, TE: 4 };
const toNum = (v?: string) => (v && !isNaN(parseInt(v)) ? parseInt(v) : null);

// Aug 31, 2026 8:00 PM CST (CDT in effect: UTC-5) => 01:00 UTC Sep 1, 2026
const DRAFT_DATE = new Date('2026-09-01T01:00:00Z');

const BUDGET_ADJUSTMENTS: Record<string, number> = {
  '11111111-0001-0001-0001-000000000001': 515,
  '11111111-0001-0001-0001-000000000003': -275,
  '11111111-0001-0001-0001-000000000005': -40,
  '11111111-0001-0001-0001-000000000002': -97,
  '11111111-0001-0001-0001-000000000004': 97,
  '11111111-0001-0001-0001-000000000010': -2,
};

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const s = Math.floor(diff / 1000);
  return {
    expired: diff === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const Season2026 = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const c = useCountdown(DRAFT_DATE);

  const teamData = useMemo(() => {
    return teams.map((team) => {
      const seen = new Set<string>();
      const rows = salaries
        .filter((s) => s.teamId === team.id)
        .map((s) => ({
          name: `${s.firstName} ${s.lastName}`,
          position: s.position,
          ft: s.franchiseTag,
          ps: s.practiceSquad,
          isRookie: !!s.rookieDraftRound,
          s2026: toNum(s.salary2026),
        }))
        .filter((r) => {
          const key = `${r.name}|${r.position}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      const active = rows
        .filter((r) => !r.ps)
        .sort((a, b) => {
          const p = (POS_ORDER[a.position] || 99) - (POS_ORDER[b.position] || 99);
          if (p !== 0) return p;
          return (b.s2026 ?? 0) - (a.s2026 ?? 0);
        });

      // Build likeliest starting lineup + bench
      type Row = (typeof active)[number];
      const pool = [...active].sort((a, b) => (b.s2026 ?? 0) - (a.s2026 ?? 0));
      const used = new Set<Row>();
      const take = (allowed: string[]) => {
        const pick = pool.find((p) => !used.has(p) && allowed.includes(p.position));
        if (pick) used.add(pick);
        return pick ?? null;
      };
      const FLEX = ['RB', 'WR', 'TE'];
      const ANY = ['QB', 'RB', 'WR', 'TE'];
      const starters: { label: string; player: Row | null }[] = [
        { label: 'QB', player: take(['QB']) },
        { label: 'RB', player: take(['RB']) },
        { label: 'RB', player: take(['RB']) },
        { label: 'WR', player: take(['WR']) },
        { label: 'WR', player: take(['WR']) },
        { label: 'FLEX', player: take(FLEX) },
        { label: 'FLEX', player: take(FLEX) },
        { label: 'FLEX', player: take(FLEX) },
        { label: 'OP', player: take(ANY) },
      ];
      const benchPlayers = pool.filter((p) => !used.has(p));
      const bench = Array.from({ length: Math.max(6, benchPlayers.length) }, (_, i) => ({
        label: `BN${i + 1}`,
        player: benchPlayers[i] ?? null,
      }));

      const veteranSpent = active.reduce((sum, r) => sum + (r.isRookie ? 0 : r.s2026 ?? 0), 0);
      const budget = 1000 + (BUDGET_ADJUSTMENTS[team.id] ?? 0) - veteranSpent;
      const openSpots = Math.max(0, starters.length + bench.length - active.length);
      const budgetPerSpot = openSpots > 0 ? Math.floor(budget / openSpots) : null;
      return { team, starters, bench, budget, openSpots, budgetPerSpot };
    });
  }, [teams, salaries]);


  const isLoading = teamsLoading || salariesLoading;

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-2">2026 SEASON</h1>
            <p className="text-muted-foreground">
              Active rosters and remaining fall draft budgets for all ten franchises.
            </p>
          </motion.div>

          {/* Countdown */}
          <div className="mb-10 rounded-lg border-2 border-primary/30 bg-card p-6 md:p-8 text-center shadow-md">
            <div className="flex items-center justify-center gap-2 mb-2 text-primary">
              <CalendarClock className="h-5 w-5" />
              <h2 className="font-display uppercase tracking-widest text-sm font-bold">
                Fall Draft
              </h2>
            </div>
            <p className="font-display text-xl md:text-2xl font-extrabold mb-6">
              August 31, 2026 &middot; 8:00 PM CST
            </p>
            {c.expired ? (
              <p className="font-display text-2xl font-extrabold text-primary uppercase">
                The Fall Draft is here
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
                {[
                  { label: 'Days', value: c.days },
                  { label: 'Hours', value: c.hours },
                  { label: 'Minutes', value: c.minutes },
                  { label: 'Seconds', value: c.seconds },
                ].map((u) => (
                  <div key={u.label} className="rounded-md bg-muted/50 border border-border py-4">
                    <div className="font-mono text-2xl md:text-4xl font-extrabold text-primary tabular-nums">
                      {String(u.value).padStart(2, '0')}
                    </div>
                    <div className="font-display uppercase tracking-wider text-[10px] md:text-xs text-muted-foreground mt-1">
                      {u.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {teamData.map(({ team, starters, bench, budget, openSpots, budgetPerSpot }) => (
                <div
                  key={team.id}
                  className="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
                >
                  <div className="flex flex-col border-b border-border bg-muted/50 px-4 py-4">
                    <h3 className="font-display font-bold uppercase tracking-wide text-sm text-center mb-4">
                      {team.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Fall Draft Budget', value: `$${budget}`, valueClass: budget < 0 ? 'text-destructive' : 'text-primary' },
                        { label: 'Open Roster Spots', value: openSpots.toString(), valueClass: 'text-foreground' },
                        { label: 'Budget Per Spot', value: budgetPerSpot != null ? `$${budgetPerSpot}` : '-', valueClass: 'text-foreground' },
                      ].map((metric) => (
                        <div key={metric.label} className="text-center rounded-md bg-background/60 border border-border/60 px-2 py-2">
                          <div className="font-display uppercase tracking-wider text-[10px] text-muted-foreground mb-1">
                            {metric.label}
                          </div>
                          <div className={cn('font-mono font-extrabold text-lg', metric.valueClass)}>
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {([
                    { title: 'Starting Lineup', slots: starters },
                    { title: 'Bench', slots: bench },
                  ] as const).map((group) => (
                    <div key={group.title}>
                      <div className="bg-primary/10 px-4 py-1.5 font-display uppercase tracking-wider text-[10px] font-bold">
                        {group.title}
                      </div>
                      <ul className="divide-y divide-border/50">
                        {group.slots.map((slot, i) => (
                          <li key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                            <span className="font-display uppercase tracking-wider text-[10px] text-muted-foreground w-10 shrink-0">
                              {slot.label}
                            </span>
                            {slot.player ? (
                              <>
                                <span
                                  className={cn(
                                    'inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-display font-bold border shrink-0',
                                    positionColors[slot.player.position] ||
                                      'bg-gray-100 text-gray-700 border-gray-200'
                                  )}
                                >
                                  {slot.player.position}
                                </span>
                                <span className="font-medium flex-1 truncate">{slot.player.name}</span>
                                {slot.player.ft && (
                                  <Star size={14} className="text-gold fill-gold shrink-0" />
                                )}
                                <span className="font-mono text-muted-foreground">
                                  {slot.player.s2026 != null ? `$${slot.player.s2026}` : '-'}
                                </span>
                              </>
                            ) : (
                              <span className="flex-1 font-display uppercase tracking-wider text-[10px] italic text-muted-foreground">
                                Open
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}

            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Season2026;
