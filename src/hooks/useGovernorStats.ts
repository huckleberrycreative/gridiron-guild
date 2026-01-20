import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GovernorStats {
  id: string;
  name: string;
  teamName: string;
  yearsActive: number;
  totalWins: number;
  totalLosses: number;
  championships: number;
  playoffAppearances: number;
  playoffWins: number;
  playoffLosses: number;
  avgPointsPerYear: number;
  avgFinish: number;
  bestFinish: number;
  worstFinish: number;
  finalsAppearances: number;
  totalPointsFor: number;
}

export function useGovernorStats() {
  return useQuery({
    queryKey: ['governor-stats'],
    queryFn: async () => {
      // Get teams list first
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, owner_name')
        .neq('name', 'Bellevue Crackdown');

      if (teamsError) throw teamsError;

      // Get regular season stats (without join)
      const { data: seasonStats, error: seasonError } = await supabase
        .from('regular_season_standings')
        .select('team_id, season_id, wins, losses, total_points_for, rank');

      if (seasonError) throw seasonError;

      // Get playoff stats (without join)
      const { data: playoffStats, error: playoffError } = await supabase
        .from('playoff_outcomes')
        .select('team_id, rank, is_finalist');

      if (playoffError) throw playoffError;

      // Aggregate stats by team
      const governorMap = new Map<string, GovernorStats>();

      teams?.forEach((team) => {
        governorMap.set(team.id, {
          id: team.id,
          name: team.owner_name || 'Unknown',
          teamName: team.name,
          yearsActive: 0,
          totalWins: 0,
          totalLosses: 0,
          championships: 0,
          playoffAppearances: 0,
          playoffWins: 0,
          playoffLosses: 0,
          avgPointsPerYear: 0,
          avgFinish: 0,
          bestFinish: 10,
          worstFinish: 1,
          finalsAppearances: 0,
          totalPointsFor: 0,
        });
      });

      // Aggregate season stats
      const seasonsByTeam = new Map<string, Set<string>>();
      const ranksByTeam = new Map<string, number[]>();

      seasonStats?.forEach((stat) => {
        const governor = governorMap.get(stat.team_id);
        if (governor) {
          governor.totalWins += stat.wins || 0;
          governor.totalLosses += stat.losses || 0;
          governor.totalPointsFor += stat.total_points_for || 0;

          // Track seasons
          if (!seasonsByTeam.has(stat.team_id)) {
            seasonsByTeam.set(stat.team_id, new Set());
          }
          seasonsByTeam.get(stat.team_id)?.add(stat.season_id);

          // Track ranks for average
          if (!ranksByTeam.has(stat.team_id)) {
            ranksByTeam.set(stat.team_id, []);
          }
          if (stat.rank) {
            ranksByTeam.get(stat.team_id)?.push(stat.rank);
            governor.bestFinish = Math.min(governor.bestFinish, stat.rank);
            governor.worstFinish = Math.max(governor.worstFinish, stat.rank);
          }
        }
      });

      // Calculate years active and average finish
      governorMap.forEach((governor, teamId) => {
        const seasons = seasonsByTeam.get(teamId);
        governor.yearsActive = seasons?.size || 0;

        const ranks = ranksByTeam.get(teamId);
        if (ranks && ranks.length > 0) {
          governor.avgFinish = ranks.reduce((a, b) => a + b, 0) / ranks.length;
        }

        if (governor.yearsActive > 0) {
          governor.avgPointsPerYear = governor.totalPointsFor / governor.yearsActive;
        }
      });

      // Aggregate playoff stats
      playoffStats?.forEach((stat) => {
        const governor = governorMap.get(stat.team_id);
        if (governor) {
          // Playoff appearance = rank 1-4
          if (stat.rank && stat.rank <= 4) {
            governor.playoffAppearances++;

            // Championship
            if (stat.rank === 1) {
              governor.championships++;
              governor.playoffWins++;
            }

            // Finals appearance (finalist who didn't win)
            if (stat.is_finalist) {
              governor.finalsAppearances++;
              if (stat.rank !== 1) {
                governor.playoffLosses++;
                // Still counts as a playoff win to get to finals
                governor.playoffWins++;
              }
            } else if (stat.rank <= 4 && stat.rank !== 1) {
              // Lost in semis
              governor.playoffLosses++;
            }
          }
        }
      });

      // Convert to array and sort by championships, then wins
      const governors = Array.from(governorMap.values())
        .sort((a, b) => {
          if (b.championships !== a.championships) return b.championships - a.championships;
          if (b.playoffAppearances !== a.playoffAppearances) return b.playoffAppearances - a.playoffAppearances;
          return b.totalWins - a.totalWins;
        });

      return governors;
    },
  });
}
