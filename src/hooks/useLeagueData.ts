import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamWithStandings {
  id: string;
  name: string;
  owner: string;
  rank: number;
  totalPoints: number;
  pointsFor: number;
  wins: number;
  losses: number;
  avgPPW: number;
}

// Fetch teams from database
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });
}

// Fetch the active season
export function useActiveSeason() {
  return useQuery({
    queryKey: ['active-season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

// Fetch standings for the active season with team data
export function useActiveSeasonStandings() {
  return useQuery({
    queryKey: ['active-season-standings'],
    queryFn: async () => {
      // First get the active season
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!season) return [];

      // Then get standings for that season with team data
      const { data: standings, error: standingsError } = await supabase
        .from('regular_season_standings')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('season_id', season.id)
        .order('rank');

      if (standingsError) throw standingsError;

      // Transform to the format expected by the UI
      const transformedStandings: TeamWithStandings[] = (standings || []).map((s) => ({
        id: s.team?.id || s.team_id,
        name: s.team?.name || 'Unknown Team',
        owner: s.team?.owner_name || 'Unknown Owner',
        rank: s.rank,
        totalPoints: s.points_accumulated || 0,
        pointsFor: s.total_points_for || 0,
        wins: s.wins || 0,
        losses: s.losses || 0,
        avgPPW: s.average_ppw || 0,
      }));

      return transformedStandings;
    },
  });
}

// Fetch standings for a specific season
export function useSeasonStandings(seasonId: string | undefined) {
  return useQuery({
    queryKey: ['season-standings', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];

      const { data: standings, error } = await supabase
        .from('regular_season_standings')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('season_id', seasonId)
        .order('rank');

      if (error) throw error;

      const transformedStandings: TeamWithStandings[] = (standings || []).map((s) => ({
        id: s.team?.id || s.team_id,
        name: s.team?.name || 'Unknown Team',
        owner: s.team?.owner_name || 'Unknown Owner',
        rank: s.rank,
        totalPoints: s.points_accumulated || 0,
        pointsFor: s.total_points_for || 0,
        wins: s.wins || 0,
        losses: s.losses || 0,
        avgPPW: s.average_ppw || 0,
      }));

      return transformedStandings;
    },
    enabled: !!seasonId,
  });
}

// Fetch all seasons
export function useSeasons() {
  return useQuery({
    queryKey: ['seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export interface PlayoffOutcome {
  id: string;
  teamId: string;
  teamName: string;
  ownerName: string;
  rank: number;
  semifinalScore: number | null;
  isFinalist: boolean;
  finalsScore: number | null;
}

// Fetch playoff outcomes for the active season
export function usePlayoffOutcomes() {
  return useQuery({
    queryKey: ['active-playoff-outcomes'],
    queryFn: async () => {
      // First get the active season
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!season) return [];

      // Get playoff outcomes for the active season
      const { data: outcomes, error } = await supabase
        .from('playoff_outcomes')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('season_id', season.id)
        .order('rank');

      if (error) throw error;

      const transformedOutcomes: PlayoffOutcome[] = (outcomes || []).map((o) => ({
        id: o.id,
        teamId: o.team_id,
        teamName: o.team?.name || 'Unknown Team',
        ownerName: o.team?.owner_name || 'Unknown Owner',
        rank: o.rank,
        semifinalScore: o.semifinal_score,
        isFinalist: o.is_finalist,
        finalsScore: o.finals_score,
      }));

      return transformedOutcomes;
    },
  });
}
