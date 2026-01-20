import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RivalryMatchup {
  id: string;
  rivalry_id: string;
  season: number;
  team1_score: number;
  team2_score: number;
  winner: 'team1' | 'team2';
}

export interface Rivalry {
  id: string;
  game_name: string;
  slogan: string | null;
  trophy_name: string | null;
  team1_governor: string;
  team2_governor: string;
  origin_story: string[] | null;
  matchups: RivalryMatchup[];
}

export function useRivalries() {
  return useQuery({
    queryKey: ['rivalries'],
    queryFn: async () => {
      // Fetch rivalries
      const { data: rivalries, error: rivalriesError } = await supabase
        .from('rivalries')
        .select('*')
        .order('game_name');

      if (rivalriesError) throw rivalriesError;

      // Fetch all matchups
      const { data: matchups, error: matchupsError } = await supabase
        .from('rivalry_matchups')
        .select('*')
        .order('season', { ascending: false });

      if (matchupsError) throw matchupsError;

      // Combine rivalries with their matchups
      const rivalriesWithMatchups: Rivalry[] = (rivalries || []).map((rivalry) => ({
        id: rivalry.id,
        game_name: rivalry.game_name,
        slogan: rivalry.slogan,
        trophy_name: rivalry.trophy_name,
        team1_governor: rivalry.team1_governor,
        team2_governor: rivalry.team2_governor,
        origin_story: rivalry.origin_story,
        matchups: (matchups || [])
          .filter((m) => m.rivalry_id === rivalry.id)
          .map((m) => ({
            id: m.id,
            rivalry_id: m.rivalry_id,
            season: m.season,
            team1_score: Number(m.team1_score),
            team2_score: Number(m.team2_score),
            winner: m.winner as 'team1' | 'team2',
          })),
      }));

      return rivalriesWithMatchups;
    },
  });
}
