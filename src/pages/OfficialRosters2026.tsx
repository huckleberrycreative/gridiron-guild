import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useTeams, usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Star, Check, ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type RosterRow = {
  firstName: string;
  lastName: string;
  position: string;
  ft: boolean;
  ps: boolean;
  s2026: number | null;
  s2027: number | null;
  s2028: number | null;
  s2029: number | null;
};

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
};

const POS_ORDER: Record<string, number> = { QB: 1, RB: 2, WR: 3, TE: 4 };
const toNum = (v?: string) => (v && !isNaN(parseInt(v)) ? parseInt(v) : null);

const OfficialRosters2026 = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: salaries = [], isLoading: salariesLoading } = usePlayerSalaries();
  const [teamId, setTeamId] = useState<string | null>(null);

  const allRows: RosterRow[] = useMemo(() => {
    if (!teamId) return [];
    return salaries
      .filter((s) => s.teamId === teamId)
      .map((s) => ({
        firstName: s.firstName,
        lastName: s.lastName,
        position: s.position,
        ft: s.franchiseTag,
        ps: s.practiceSquad,
        s2026: toNum(s.salary2026),
        s2027: toNum(s.salary2027),
        s2028: toNum(s.salary2028),
        s2029: toNum(s.salary2029),
      }));
  }, [teamId, salaries]);

  const roster = allRows
    .filter((r) => !r.ps)
    .sort((a, b) => {
      const p = (POS_ORDER[a.position] || 99) - (POS_ORDER[b.position] || 99);
      if (p !== 0) return p;
      return (b.s2026 ?? 0) - (a.s2026 ?? 0);
    });

  const practiceSquad = allRows.filter((r) => r.ps);
  const psSlots: (RosterRow | null)[] = [0, 1, 2].map((i) => practiceSquad[i] ?? null);

  const totalSpent = roster.reduce((sum, r) => sum + (r.s2026 ?? 0), 0);
  const fallDraftCapital = 1000 - totalSpent;
  const selectedTeam = teams.find((t) => t.id === teamId);
  const isLoading = teamsLoading || salariesLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              OFFICIAL 2026 ROSTERS
            </h1>
            <p className="text-muted-foreground">
              Select a team to view its locked-in 2026 roster, contract status, and remaining
              fall draft capital.
            </p>
          </motion.div>

          <div className="mb-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto min-w-[280px] justify-between">
                  {selectedTeam?.name || 'Select a team'}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[320px] bg-popover z-50" align="start">
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => setTeamId(team.id)}
                    className={cn(teamId === team.id && 'bg-accent')}
                  >
                    {team.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {teamId && (
            <>
              <motion.div
                key={teamId + '-cap'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-6 p-6 rounded-lg border-2 border-primary/30 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <h2 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
                  Fall Draft Capital
                </h2>
                <span
                  className={cn(
                    'font-mono text-3xl md:text-4xl font-extrabold',
                    fallDraftCapital < 0 ? 'text-destructive' : 'text-primary'
                  )}
                >
                  ${fallDraftCapital}
                </span>
              </motion.div>

              <motion.div
                key={teamId + '-table'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="overflow-x-auto rounded-lg border border-border bg-card shadow-md"
              >
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      
                      <th className="text-left px-4 py-3 font-display uppercase tracking-wider text-xs">Player</th>
                      <th className="text-center px-3 py-3 font-display uppercase tracking-wider text-xs">Pos</th>
                      <th className="text-center px-3 py-3 font-display uppercase tracking-wider text-xs">FT</th>
                      <th className="text-center px-3 py-3 font-display uppercase tracking-wider text-xs">PS</th>
                      <th className="text-right px-3 py-3 font-display uppercase tracking-wider text-xs">2026</th>
                      <th className="text-right px-3 py-3 font-display uppercase tracking-wider text-xs">2027</th>
                      <th className="text-right px-3 py-3 font-display uppercase tracking-wider text-xs">2028</th>
                      <th className="text-right px-3 py-3 font-display uppercase tracking-wider text-xs">2029</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((r, idx) => {
                      return (
                        <tr
                          key={idx}
                          className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium">{r.firstName} {r.lastName}</span>
                          </td>
                          <td className="text-center px-3 py-3">
                            <span className={cn(
                              'inline-flex items-center justify-center w-8 h-7 rounded text-[10px] font-display font-bold border',
                              positionColors[r.position] || 'bg-gray-100 text-gray-700 border-gray-200'
                            )}>
                              {r.position}
                            </span>
                          </td>
                          <td className="text-center px-3 py-3">
                            {r.ft ? <Star size={16} className="inline text-gold fill-gold" /> : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className="text-center px-3 py-3">
                            {r.ps ? <Check size={16} className="inline text-emerald-500" /> : <span className="text-muted-foreground">-</span>}
                          </td>
                          <td className={cn('text-right px-3 py-3 font-mono', r.ft && 'text-gold font-semibold')}>
                            {r.s2026 != null ? `$${r.s2026}` : '-'}
                          </td>
                          <td className="text-right px-3 py-3 font-mono">{r.s2027 != null ? `$${r.s2027}` : '-'}</td>
                          <td className="text-right px-3 py-3 font-mono">{r.s2028 != null ? `$${r.s2028}` : '-'}</td>
                          <td className="text-right px-3 py-3 font-mono">{r.s2029 != null ? `$${r.s2029}` : '-'}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted/40 font-semibold">
                      <td className="px-4 py-3" colSpan={4}>
                        <span className="font-display uppercase tracking-wider text-xs">2026 Total Committed</span>
                      </td>
                      <td className="text-right px-3 py-3 font-mono">${totalSpent}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>

              <motion.div
                key={teamId + '-ps'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mt-6 overflow-x-auto rounded-lg border border-border bg-card shadow-md"
              >
                <div className="bg-muted/50 border-b border-border px-4 py-3">
                  <h3 className="font-display uppercase tracking-wider text-sm font-bold">
                    Rookie Practice Squad
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2 font-display uppercase tracking-wider text-xs w-16">Slot</th>
                      <th className="text-left px-4 py-2 font-display uppercase tracking-wider text-xs">Player</th>
                      <th className="text-center px-3 py-2 font-display uppercase tracking-wider text-xs">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psSlots.map((p, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3 font-mono text-muted-foreground">#{i + 1}</td>
                        <td className="px-4 py-3">
                          {p ? (
                            <span className="font-medium">{p.firstName} {p.lastName}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Empty</span>
                          )}
                        </td>
                        <td className="text-center px-3 py-3">
                          {p ? (
                            <span className={cn(
                              'inline-flex items-center justify-center w-8 h-7 rounded text-[10px] font-display font-bold border',
                              positionColors[p.position] || 'bg-gray-100 text-gray-700 border-gray-200'
                            )}>
                              {p.position}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

              <p className="mt-4 text-xs text-muted-foreground">
                Roster names are placeholders. Official rosters will be loaded from the league CSV.
              </p>
            </>
          )}

          {!teamId && (
            <div className="text-center py-16 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">Select a team above to view their roster.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default OfficialRosters2026;
