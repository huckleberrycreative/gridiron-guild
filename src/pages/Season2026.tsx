import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useTeams } from '@/hooks/usePlayerSalaries';
import {
  useWeeklyScores,
  REGULAR_SEASON_WEEKS,
  pointsForFinish,
} from '@/hooks/useWeeklyScores';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Muted heatmap from best (soft green) through yellow to worst (soft red).
const RANK_STYLES = [
  'bg-emerald-200 text-emerald-900',
  'bg-emerald-100 text-emerald-800',
  'bg-green-100 text-green-800',
  'bg-lime-100 text-lime-800',
  'bg-yellow-100 text-yellow-800',
  'bg-amber-100 text-amber-800',
  'bg-orange-100 text-orange-800',
  'bg-orange-200 text-orange-900',
  'bg-red-200 text-red-900',
  'bg-red-300 text-red-950',
];

const rankStyle = (place: number, fieldSize: number) => {
  if (fieldSize <= 1) return RANK_STYLES[0];
  const idx = Math.round((place * (RANK_STYLES.length - 1)) / (fieldSize - 1));
  return RANK_STYLES[Math.min(RANK_STYLES.length - 1, idx)];
};

const Season2026 = () => {
  const { data: teams = [], isLoading: teamsLoading } = useTeams();
  const { data: scores = [], isLoading: scoresLoading } = useWeeklyScores();

  const { weeks, grid, totals } = useMemo(() => {
    const playedWeeks = Array.from(new Set(scores.map((s) => s.week))).sort((a, b) => a - b);

    // week -> teamId -> { score, place, points }
    const grid = new Map<
      number,
      Map<string, { score: number; place: number; points: number }>
    >();

    playedWeeks.forEach((w) => {
      const weekScores = scores
        .filter((s) => s.week === w)
        .sort((a, b) => b.score - a.score);
      const inner = new Map<string, { score: number; place: number; points: number }>();
      weekScores.forEach((s, i) => {
        inner.set(s.teamId, {
          score: s.score,
          place: i,
          points: pointsForFinish(i, weekScores.length),
        });
      });
      grid.set(w, inner);
    });

    const totals = new Map<string, { points: number; pf: number }>();
    teams.forEach((t) => {
      let points = 0;
      let pf = 0;
      playedWeeks.forEach((w) => {
        const cell = grid.get(w)?.get(t.id);
        if (cell) {
          points += cell.points;
          pf += cell.score;
        }
      });
      totals.set(t.id, { points, pf });
    });

    return { weeks: playedWeeks, grid, totals };
  }, [scores, teams]);

  const orderedTeams = useMemo(
    () =>
      [...teams].sort((a, b) => {
        const ta = totals.get(a.id) ?? { points: 0, pf: 0 };
        const tb = totals.get(b.id) ?? { points: 0, pf: 0 };
        return tb.points - ta.points || tb.pf - ta.pf || a.name.localeCompare(b.name);
      }),
    [teams, totals]
  );

  const allWeeks = useMemo(
    () => Array.from({ length: REGULAR_SEASON_WEEKS }, (_, i) => i + 1),
    []
  );

  const isLoading = teamsLoading || scoresLoading;

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
              Weekly scores for all ten franchises across the {REGULAR_SEASON_WEEKS}-week regular
              season. The small number in each cell is the points earned for that week's finish.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : weeks.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
              No weekly scores have been entered yet.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-left font-display uppercase tracking-wider text-[11px]">
                      Week
                    </th>
                    {orderedTeams.map((team) => (
                      <th
                        key={team.id}
                        title={team.name}
                        className="px-2 py-2 text-center"
                      >
                        <TeamLogo
                          teamName={team.name}
                          size="lg"
                          className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-md object-contain"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allWeeks.map((w) => (
                    <tr key={w} className="border-t border-border/60">
                      <td className="sticky left-0 z-10 bg-card px-3 py-2 font-display font-bold uppercase text-[11px] whitespace-nowrap">
                        Wk {w}
                      </td>
                      {orderedTeams.map((team) => {
                        const cell = grid.get(w)?.get(team.id);
                        const fieldSize = grid.get(w)?.size ?? 10;
                        if (!cell) {
                          return (
                            <td
                              key={team.id}
                              className="px-2 py-2 text-center text-muted-foreground/60 bg-muted/20"
                            >
                              —
                            </td>
                          );
                        }
                        return (
                          <td key={team.id} className="p-1">
                            <div
                              className={cn(
                                'relative rounded-md px-2 py-2 text-center font-mono font-bold tabular-nums',
                                rankStyle(cell.place, fieldSize)
                              )}
                            >
                              <span className="absolute top-0.5 right-1 text-[9px] font-semibold opacity-80">
                                {cell.points}
                              </span>
                              {cell.score.toFixed(1)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 font-display font-bold uppercase text-[11px]">
                      Total
                    </td>
                    {orderedTeams.map((team) => {
                      const total = totals.get(team.id) ?? { points: 0, pf: 0 };
                      return (
                        <td
                          key={team.id}
                          className="px-2 py-2 text-center font-mono font-extrabold"
                        >
                          <div className="text-foreground">{total.points}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {total.pf.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Season2026;
