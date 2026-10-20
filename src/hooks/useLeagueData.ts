import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { deriveStandings } from '@/lib/standingsFromScores';

export interface TeamWithStandings {
  id: string;
  name: string;
  owner: string;
  rank: number;
  totalPoints: number;
  pointsFor: number;
  wins: number;
  losses: number;
  ties: number;
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

// Fetch standings for the active season, derived live from weekly scores
export function useActiveSeasonStandings(includeProjected = false) {
  return useQuery({
    queryKey: includeProjected ? ['weekly-scores', 'projected-standings'] : ['active-season-standings'],
    queryFn: async () => {
      // First get the active season
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (seasonError) throw seasonError;
      if (!season) return [];

      const [{ data: weeklyRaw, error: weeklyError }, { data: standings, error: standingsError }, { data: proj }] =
        await Promise.all([
          supabase
            .from('weekly_scores')
            .select('week, team_id, score')
            .eq('season_year', season.year),
          supabase
            .from('regular_season_standings')
            .select(`*, team:teams(*)`)
            .eq('season_id', season.id)
            .order('rank'),
          includeProjected
            ? supabase
                .from('projected_weekly_scores')
                .select('week, team_id, projected')
                .eq('season_year', season.year)
            : Promise.resolve({ data: [] as any[] }),
        ]);

      if (weeklyError) throw weeklyError;
      if (standingsError) throw standingsError;

      let weekly: any[] = weeklyRaw || [];
      if (includeProjected && proj?.length) {
        const finalWeeks = new Set(weekly.map((r) => r.week));
        const extra = proj
          .filter((p: any) => !finalWeeks.has(p.week))
          .map((p: any) => ({ week: p.week, team_id: p.team_id, score: Number(p.projected) }));
        weekly = [...weekly, ...extra];
      }

      const teamInfo = new Map<string, { name: string; owner: string }>();
      (standings || []).forEach((s: any) => {
        teamInfo.set(s.team_id, {
          name: s.team?.name || 'Unknown Team',
          owner: s.team?.owner_name || 'Unknown Owner',
        });
      });

      // Derive standings from entered weekly scores when available
      if (weekly && weekly.length > 0) {
        return deriveStandings(
          weekly.map((r: any) => ({ week: r.week, teamId: r.team_id, score: Number(r.score) }))
        ).map((s): TeamWithStandings => ({
          id: s.teamId,
          name: teamInfo.get(s.teamId)?.name || 'Unknown Team',
          owner: teamInfo.get(s.teamId)?.owner || 'Unknown Owner',
          rank: s.rank,
          totalPoints: s.points,
          pointsFor: s.pf,
          wins: s.wins,
          losses: s.losses,
          ties: s.ties,
          avgPPW: s.avgPPW,
        }));
      }

      // Fallback: stored standings table
      const transformedStandings: TeamWithStandings[] = (standings || []).map((s) => {
        const weeksPlayed = (s.wins || 0) + (s.losses || 0);
        return {
          id: s.team?.id || s.team_id,
          name: s.team?.name || 'Unknown Team',
          owner: s.team?.owner_name || 'Unknown Owner',
          rank: s.rank,
          totalPoints: s.points_accumulated || 0,
          pointsFor: s.total_points_for || 0,
          wins: s.wins || 0,
          losses: s.losses || 0,
          ties: 0,
          avgPPW: weeksPlayed > 0 ? (s.total_points_for || 0) / weeksPlayed : 0,
        };
      });

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

      const transformedStandings: TeamWithStandings[] = (standings || []).map((s) => {
        const weeksPlayed = (s.wins || 0) + (s.losses || 0);
        return {
          id: s.team?.id || s.team_id,
          name: s.team?.name || 'Unknown Team',
          owner: s.team?.owner_name || 'Unknown Owner',
          rank: s.rank,
          totalPoints: s.points_accumulated || 0,
          pointsFor: s.total_points_for || 0,
          wins: s.wins || 0,
          losses: s.losses || 0,
          ties: 0,
          // Compute PPW live: total points divided by weeks played
          avgPPW: weeksPlayed > 0 ? (s.total_points_for || 0) / weeksPlayed : 0,
        };
      });

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
