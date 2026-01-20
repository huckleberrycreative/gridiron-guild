import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerSalaryWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  fantasyTeam: string;
  franchiseTag: boolean;
  rookieDraftRound?: string;
  salary2025?: string;
  salary2026?: string;
  salary2027?: string;
  salary2028?: string;
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
        franchiseTag: s.franchise_tag || false,
        rookieDraftRound: s.rookie_draft_round || undefined,
        salary2025: s.salary_2025 || undefined,
        salary2026: s.salary_2026 || undefined,
        salary2027: s.salary_2027 || undefined,
        salary2028: s.salary_2028 || undefined,
      }));

      return transformed;
    },
  });
}
