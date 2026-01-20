import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, Column } from '@/components/SortableTable';
import { usePlayerSalaries, PlayerSalaryWithDetails } from '@/hooks/usePlayerSalaries';
import { cn } from '@/lib/utils';
import { Star, Loader2 } from 'lucide-react';

const positionColors: Record<string, string> = {
  QB: 'bg-red-100 text-red-700 border-red-200',
  RB: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  WR: 'bg-blue-100 text-blue-700 border-blue-200',
  TE: 'bg-amber-100 text-amber-700 border-amber-200',
  K: 'bg-purple-100 text-purple-700 border-purple-200',
  DEF: 'bg-slate-100 text-slate-700 border-slate-200',
};

const Salaries = () => {
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const { data: players = [], isLoading, error } = usePlayerSalaries();

  const positions = ['ALL', 'QB', 'RB', 'WR', 'TE'];

  const filteredPlayers = positionFilter === 'ALL'
    ? players
    : players.filter((p) => p.position === positionFilter);

  const columns: Column<PlayerSalaryWithDetails>[] = [
    {
      key: 'position',
      label: 'Pos',
      sortable: true,
      render: (value) => (
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-display font-bold border',
            positionColors[value as string] || 'bg-gray-100 text-gray-700 border-gray-200'
          )}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'fantasyTeam',
      label: 'Fantasy Team',
      sortable: true,
      render: (value) => <span className="text-sm font-medium">{value as string}</span>,
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
      render: (value) => <span className="text-sm">{value as string}</span>,
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
      render: (value) => <span className="text-sm font-semibold">{value as string}</span>,
    },
    {
      key: 'franchiseTag',
      label: 'FT?',
      sortable: true,
      align: 'center',
      render: (value) => (
        value ? (
          <Star size={16} className="text-gold fill-gold" />
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'rookieDraftRound',
      label: 'Rd',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-mono text-sm">
          {value ? `R${value}` : '-'}
        </span>
      ),
    },
    {
      key: 'salary2025',
      label: '2025',
      sortable: true,
      align: 'right',
      render: (value, row) => (
        <span className={cn('font-mono', row.franchiseTag && 'text-gold font-semibold')}>
          {value ? `$${value}` : '-'}
        </span>
      ),
    },
    {
      key: 'salary2026',
      label: '2026',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono">
          {value ? `$${value}` : '-'}
        </span>
      ),
    },
    {
      key: 'salary2027',
      label: '2027',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono">
          {value ? `$${value}` : '-'}
        </span>
      ),
    },
    {
      key: 'salary2028',
      label: '2028',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono">
          {value ? `$${value}` : '-'}
        </span>
      ),
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
          <p className="text-destructive">Error loading salaries</p>
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">PLAYER SALARIES</h1>
            <p className="text-muted-foreground">
              Dynasty salary database with escalating contract values.
            </p>
          </motion.div>

          {/* Position Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-display font-semibold uppercase tracking-wider transition-all duration-200',
                    positionFilter === pos
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {pos}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Franchise Tag Legend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-6 p-4 bg-card rounded-lg border border-border"
          >
            <div className="flex items-center gap-2 text-sm">
              <Star size={14} className="text-gold fill-gold" />
              <span className="text-muted-foreground">
                Franchise Tagged players: $100/year for 4 seasons
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {filteredPlayers.length > 0 ? (
              <SortableTable
                data={filteredPlayers}
                columns={columns}
                defaultSortKey="lastName"
                className="shadow-md"
              />
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">
                  No players found. Add players via the admin dashboard.
                </p>
              </div>
            )}
          </motion.div>

          {/* Position Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap gap-4 text-sm"
          >
            {Object.entries(positionColors).filter(([pos]) => ['QB', 'RB', 'WR', 'TE'].includes(pos)).map(([pos, colors]) => (
              <div key={pos} className="flex items-center gap-2">
                <span className={cn('inline-block w-6 h-6 rounded text-xs font-display font-bold flex items-center justify-center border', colors)}>
                  {pos}
                </span>
                <span className="text-muted-foreground">
                  {pos === 'QB' && 'Quarterback'}
                  {pos === 'RB' && 'Running Back'}
                  {pos === 'WR' && 'Wide Receiver'}
                  {pos === 'TE' && 'Tight End'}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Salaries;
