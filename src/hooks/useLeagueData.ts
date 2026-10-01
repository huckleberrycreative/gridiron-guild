import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LEGACY_WEEK1_FINISH_POINTS, pointsForFinish } from '@/hooks/useWeeklyScores';

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

      const [{ data: weekly, error: weeklyError }, { data: standings, error: standingsError }] =
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
        ]);

      if (weeklyError) throw weeklyError;
      if (standingsError) throw standingsError;

      const teamInfo = new Map<string, { name: string; owner: string }>();
      (standings || []).forEach((s: any) => {
        teamInfo.set(s.team_id, {
          name: s.team?.name || 'Unknown Team',
          owner: s.team?.owner_name || 'Unknown Owner',
        });
      });

      // Derive standings from entered weekly scores when available
      if (weekly && weekly.length > 0) {
        const byWeek = new Map<number, { teamId: string; score: number }[]>();
        weekly.forEach((r: any) => {
          const list = byWeek.get(r.week) || [];
          list.push({ teamId: r.team_id, score: Number(r.score) });
          byWeek.set(r.week, list);
        });

        const totals = new Map<
          string,
          { points: number; pf: number; wins: number; losses: number; ties: number; weeks: number }
        >();

        Array.from(byWeek.entries())
          .sort((a, b) => a[0] - b[0])
          .forEach(([week, rows]) => {
            const ordered = [...rows].sort((a, b) => b.score - a.score);
            const fieldSize = ordered.length;
            ordered.forEach((row, index) => {
              const pts =
                week === 1
                  ? LEGACY_WEEK1_FINISH_POINTS[index] ?? 1
                  : pointsForFinish(index, fieldSize);
              const cur =
                totals.get(row.teamId) || { points: 0, pf: 0, wins: 0, losses: 0, ties: 0, weeks: 0 };
              cur.points += pts;
              cur.pf += row.score;
              cur.weeks += 1;
              // Weekly finish: Top 4 = W, 5th = TIE, bottom = L
              if (index < 4) cur.wins += 1;
              else if (index === 4) cur.ties += 1;
              else cur.losses += 1;
              totals.set(row.teamId, cur);
            });
          });

        const derived: TeamWithStandings[] = Array.from(totals.entries())
          .map(([teamId, t]) => ({
            id: teamId,
            name: teamInfo.get(teamId)?.name || 'Unknown Team',
            owner: teamInfo.get(teamId)?.owner || 'Unknown Owner',
            rank: 0,
            totalPoints: t.points,
            pointsFor: t.pf,
            wins: t.wins,
            losses: t.losses,
            ties: t.ties,
            avgPPW: t.weeks > 0 ? t.pf / t.weeks : 0,
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints || b.pointsFor - a.pointsFor)
          .map((row, i) => ({ ...row, rank: i + 1 }));

        return derived;
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
