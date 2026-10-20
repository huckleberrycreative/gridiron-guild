import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const SEASON_YEAR = 2026;
export const REGULAR_SEASON_WEEKS = 13;

export type WeeklyScore = {
  id: string;
  week: number;
  teamId: string;
  score: number;
};

export const useWeeklyScores = (seasonYear: number = SEASON_YEAR) =>
  useQuery({
    queryKey: ['weekly-scores', seasonYear],
    queryFn: async (): Promise<WeeklyScore[]> => {
      const { data, error } = await supabase
        .from('weekly_scores')
        .select('id, week, team_id, score')
        .eq('season_year', seasonYear)
        .order('week');
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        week: r.week,
        teamId: r.team_id,
        score: Number(r.score),
      }));
    },
  });

// Scoring rules live in the pure lib module; re-exported here for existing imports.
export {
  WEEKLY_FINISH_POINTS,
  pointsForFinish,
  RIVALRY_WIN_POINTS,
  RIVALRY_WEEKS,
  weeklyPoints,
} from '@/lib/scoring';
