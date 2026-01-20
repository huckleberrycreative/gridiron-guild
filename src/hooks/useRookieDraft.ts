import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RookiePlayer {
  id: string;
  draft_year: number;
  player_name: string;
  position: string;
  college: string | null;
  notes: string | null;
}

export interface DraftPick {
  id: string;
  draft_year: number;
  round: number;
  pick_number: number;
  team_id: string | null;
  selected_player_id: string | null;
  team?: {
    id: string;
    name: string;
    owner_name: string | null;
  };
  selected_player?: RookiePlayer | null;
}

export const useRookiePool = (draftYear: number) => {
  return useQuery({
    queryKey: ['rookie-pool', draftYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rookie_pool')
        .select('*')
        .eq('draft_year', draftYear)
        .order('position')
        .order('player_name');

      if (error) throw error;
      return data as RookiePlayer[];
    },
  });
};

export const useDraftPicks = (draftYear: number) => {
  return useQuery({
    queryKey: ['draft-picks', draftYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('draft_picks')
        .select(`
          *,
          team:teams(id, name, owner_name),
          selected_player:rookie_pool(*)
        `)
        .eq('draft_year', draftYear)
        .order('round')
        .order('pick_number');

      if (error) throw error;
      return data as DraftPick[];
    },
  });
};

export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, owner_name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateDraftPick = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pickId,
      teamId,
      selectedPlayerId,
    }: {
      pickId: string;
      teamId?: string | null;
      selectedPlayerId?: string | null;
    }) => {
      const updates: Record<string, unknown> = {};
      if (teamId !== undefined) updates.team_id = teamId;
      if (selectedPlayerId !== undefined) updates.selected_player_id = selectedPlayerId;

      const { error } = await supabase
        .from('draft_picks')
        .update(updates)
        .eq('id', pickId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
    },
  });
};

export const useInitializeDraftPicks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftYear: number) => {
      // Check if picks already exist for this year
      const { data: existing } = await supabase
        .from('draft_picks')
        .select('id')
        .eq('draft_year', draftYear)
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Already initialized
      }

      // Create 30 picks (3 rounds x 10 picks)
      const picks = [];
      for (let round = 1; round <= 3; round++) {
        for (let pick = 1; pick <= 10; pick++) {
          picks.push({
            draft_year: draftYear,
            round,
            pick_number: pick,
            team_id: null,
            selected_player_id: null,
          });
        }
      }

      const { error } = await supabase.from('draft_picks').insert(picks);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-picks'] });
    },
  });
};
