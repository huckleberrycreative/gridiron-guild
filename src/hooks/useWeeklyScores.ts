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

// Points awarded by weekly finish: 1st = 20 ... 10th = 1
export const WEEKLY_FINISH_POINTS = [20, 18, 16, 14, 12, 5, 4, 3, 2, 1];

export const pointsForFinish = (place: number, fieldSize: number) => {
  if (fieldSize >= 10) return WEEKLY_FINISH_POINTS[place] ?? 1;
  // Smaller fields: scale down from 20 to 1 linearly
  return Math.round(20 - (place * 19) / Math.max(1, fieldSize - 1));
};
