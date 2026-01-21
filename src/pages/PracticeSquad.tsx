import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { SortableTable, Column } from '@/components/SortableTable';
import { Users, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PracticeSquadPlayer {
  id: string;
  playerName: string;
  position: string;
  teamName: string;
  salary: string | null;
}

const PracticeSquad = () => {
  // Fetch practice squad players from database
  const { data: practiceSquadPlayers, isLoading } = useQuery({
    queryKey: ['practice-squad-players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_salaries')
        .select(`
          id,
          salary_2025,
          salary_2026,
          players!inner (
            id,
            full_name,
            position
          ),
          teams (
            id,
            name
          )
        `)
        .eq('practice_squad', true)
        .order('team_id');

      if (error) throw error;

      return data.map((ps: any) => ({
        id: ps.id,
        playerName: ps.players?.full_name || 'Unknown',
        position: ps.players?.position || '-',
        teamName: ps.teams?.name || 'Free Agent',
        salary: ps.salary_2026 || ps.salary_2025 || '-',
      })) as PracticeSquadPlayer[];
    },
  });

  // Group players by team
  const playersByTeam = practiceSquadPlayers?.reduce((acc, player) => {
    if (!acc[player.teamName]) {
      acc[player.teamName] = [];
    }
    acc[player.teamName].push(player);
    return acc;
  }, {} as Record<string, PracticeSquadPlayer[]>) || {};

  const columns: Column<PracticeSquadPlayer>[] = [
    {
      key: 'playerName',
      label: 'Player',
      sortable: true,
      render: (value) => <span className="font-semibold">{value as string}</span>,
    },
    {
      key: 'position',
      label: 'POS',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded">
          {value as string}
        </span>
      ),
    },
    {
      key: 'teamName',
      label: 'Team',
      sortable: true,
      render: (value) => <span className="text-sm">{value as string}</span>,
    },
    {
      key: 'salary',
      label: 'Salary',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className="font-mono text-sm text-accent">
          {value as string}
        </span>
      ),
    },
  ];

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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">PRACTICE SQUAD</h1>
            <p className="text-muted-foreground">
              Each team's developmental roster stashes. Players on the practice squad are protected from waivers.
            </p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 p-4 bg-card rounded-lg border border-border"
          >
            <div className="flex items-start gap-3">
              <Users size={20} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-1">
                  Practice Squad Rules
                </h3>
                <p className="text-sm text-muted-foreground">
                  Each team may stash up to 3 players on their practice squad. Players on the practice squad 
                  do not count against your salary cap but cannot be started in weekly lineups. Practice squad 
                  players may be promoted to the active roster at any time.
                </p>
              </div>
            </div>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : practiceSquadPlayers && practiceSquadPlayers.length > 0 ? (
            <>
            {/* Team Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {Object.entries(playersByTeam).map(([teamName, players]) => (
                  <div key={teamName} className="bg-card border border-border rounded-lg p-4">
                    <h3 className="font-display font-bold text-sm mb-3 text-primary">{teamName}</h3>
                    <ul className="space-y-2">
                      {players.map((player) => (
                        <li key={player.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-win" />
                            <span>{player.playerName}</span>
                            <span className="text-xs text-muted-foreground">({player.position})</span>
                          </div>
                          <span className="font-mono text-accent">{player.salary}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{players.length}/3 spots filled</span>
                      <span className="font-mono font-semibold text-gold">
                        Total: ${players.reduce((sum, p) => {
                          const salaryNum = parseInt(p.salary?.replace(/\D/g, '') || '0');
                          return sum + salaryNum;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No practice squad players found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Players can be added to the practice squad via the Player Salaries admin page.
              </p>
            </div>
          )}

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Check size={16} className="text-win" />
              <span>Practice Squad player (protected from waivers)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-accent">Salary</span>
              <span>Contract value when promoted to active roster</span>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default PracticeSquad;
