import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerSalaryWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  fantasyTeam: string;
  teamId: string | null;
  franchiseTag: boolean;
  practiceSquad: boolean;
  rookieDraftRound?: string;
  salary2026?: string;
  salary2027?: string;
  salary2028?: string;
  salary2029?: string;
  actualPpg: number | null;
  gamesPlayed: number;
  espnLineupSlot?: number | null;
  espnProjPpg: number | null;
  injuryStatus: string;
  injuryWeeksOut: number;
}

// Fetch player salaries with player and team data
export function usePlayerSalaries() {
  return useQuery({
    queryKey: ['player-salaries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_salaries')
        .select(`
          *,
          player:players(*),
          team:teams(*)
        `)
        .order('player(last_name)');

      if (error) throw error;

      // Transform to the format expected by the UI
      const transformed: PlayerSalaryWithDetails[] = (data || []).map((s) => ({
        id: s.id,
        firstName: s.player?.first_name || '',
        lastName: s.player?.last_name || '',
        position: s.player?.position || '',
        fantasyTeam: s.team?.name || 'Free Agent',
        teamId: s.team_id,
        franchiseTag: s.franchise_tag || false,
        actualPpg: s.actual_ppg != null ? Number(s.actual_ppg) : null,
        gamesPlayed: s.games_played ?? 0,
        espnLineupSlot: (s as any).espn_lineup_slot ?? null,
        espnProjPpg: s.espn_proj_ppg != null ? Number(s.espn_proj_ppg) : null,
        practiceSquad: s.practice_squad || false,
        rookieDraftRound: s.rookie_draft_round || undefined,
        injuryStatus: (s as any).injury_status || 'healthy',
        injuryWeeksOut: (s as any).injury_weeks_out ?? 0,
        // Remove $ prefix if present since we add it in the UI
        salary2026: s.salary_2026?.replace(/^\$/, '') || undefined,
        salary2027: s.salary_2027?.replace(/^\$/, '') || undefined,
        salary2028: s.salary_2028?.replace(/^\$/, '') || undefined,
        salary2029: s.salary_2029?.replace(/^\$/, '') || undefined,
      }));

      return transformed;
    },
  });
}

// Fetch all teams for filtering
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}
