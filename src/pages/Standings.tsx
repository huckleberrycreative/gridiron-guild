import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, Column } from '@/components/SortableTable';
import { useActiveSeasonStandings, TeamWithStandings } from '@/hooks/useLeagueData';
import { Trophy, Medal, AlertTriangle, Skull, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TeamLogo } from '@/components/TeamLogo';
// Ranking points by position (1st through 10th)
const RANKING_POINTS: Record<number, number> = {
  1: 20,
  2: 18,
  3: 16,
  4: 14,
  5: 12,
  6: 5,
  7: 4,
  8: 3,
  9: 2,
  10: 1,
};

const Standings = () => {
  const { data: standings = [], isLoading, error } = useActiveSeasonStandings();

  const getPlayoffTier = (rank: number): 'playoff' | 'purgatory' | 'toilet' => {
    if (rank <= 4) return 'playoff';
    if (rank === 5) return 'purgatory';
    return 'toilet';
  };

  const columns: Column<TeamWithStandings>[] = [
    {
      key: 'rank',
      label: 'Rank',
      sortable: false,
      render: (_, row) => {
        const rank = row.rank;
        const tier = getPlayoffTier(rank);
        return (
          <div className="flex items-center gap-2">
            {rank === 1 && <Trophy size={16} className="text-gold" />}
            {rank === 2 && <Medal size={16} className="text-muted-foreground" />}
            {rank === 3 && <Medal size={16} className="text-amber-700" />}
            {tier === 'purgatory' && <AlertTriangle size={14} className="text-amber-500" />}
            {tier === 'toilet' && <Skull size={14} className="text-loss" />}
            <span className={cn(
              'font-display font-bold',
              rank <= 3 && 'text-gold',
              tier === 'purgatory' && 'text-amber-500',
              tier === 'toilet' && 'text-loss'
            )}>
              {rank}
            </span>
          </div>
        );
      },
    },
    {
      key: 'name',
      label: 'Team',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <TeamLogo teamName={row.name} size="md" />
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.owner}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalPoints',
      label: 'Standings Pts',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-mono font-bold text-accent text-lg">{value as number}</span>
      ),
    },
    {
      key: 'pointsFor',
      label: 'Total PF',
      sortable: true,
      align: 'right',
      render: (value) => <span className="font-mono">{(value as number).toFixed(1)}</span>,
    },
    {
      key: 'wins',
      label: 'W-L',
      sortable: true,
      align: 'center',
      render: (_, row) => (
        <span className="font-mono">
          <span className="text-win">{row.wins}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-loss">{row.losses}</span>
        </span>
      ),
    },
    {
      key: 'avgPPW',
      label: 'Avg PPW',
      sortable: true,
      align: 'right',
      render: (value) => <span className="font-mono">{(value as number).toFixed(1)}</span>,
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-destructive">Error loading standings</p>
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">LEAGUE STANDINGS</h1>
            <p className="text-muted-foreground">
              Points-based ranking system. Earn standings points based on weekly finish.
            </p>
          </motion.div>

          {/* Points System Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 p-4 bg-card rounded-lg border border-border"
          >
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-3 text-muted-foreground">
              Weekly Points System
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(RANKING_POINTS).map(([rank, points]) => {
                const tier = getPlayoffTier(Number(rank));
                return (
                  <div
                    key={rank}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
                      tier === 'playoff' && 'bg-gold/10 text-gold border border-gold/20',
                      tier === 'purgatory' && 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
                      tier === 'toilet' && 'bg-loss/10 text-loss border border-loss/20'
                    )}
                  >
                    <span className="font-display font-bold">{rank}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-semibold">{points} pts</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Playoff Tiers Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 grid sm:grid-cols-3 gap-4"
          >
            <div className="p-3 bg-gold/10 border border-gold/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={16} className="text-gold" />
                <span className="font-display font-bold text-sm text-gold">If Playoffs Started Tomorrow</span>
              </div>
              <p className="text-xs text-muted-foreground">Ranks 1-4</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="font-display font-bold text-sm text-amber-600">Purgatory</span>
              </div>
              <p className="text-xs text-muted-foreground">Rank 5</p>
            </div>
            <div className="p-3 bg-loss/10 border border-loss/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Skull size={16} className="text-loss" />
                <span className="font-display font-bold text-sm text-loss">The Toilet Bowl</span>
              </div>
              <p className="text-xs text-muted-foreground">Ranks 6-10</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <SortableTable
              data={standings}
              columns={columns}
              defaultSortKey="totalPoints"
              className="shadow-md"
            />
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-accent font-semibold">Standings Pts</span>
              <span>Accumulated weekly position points</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">PF</span>
              <span>Total Fantasy Points For</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono">PPW</span>
              <span>Points Per Week</span>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Standings;
