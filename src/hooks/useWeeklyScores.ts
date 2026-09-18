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

// Points awarded by weekly finish: 1st = 20 ... 10th = 0
export const WEEKLY_FINISH_POINTS = [20, 18, 16, 14, 8, 4, 3, 2, 1, 0];

export const pointsForFinish = (place: number, fieldSize: number) => {
  if (fieldSize >= 10) return WEEKLY_FINISH_POINTS[place] ?? 0;
  // Smaller fields (per the Constitution): no more than 50% of teams are
  // rewarded for true "wins." Top 4 keep 20/18/16/14, the next spot is the
  // 8-point "tie" zone, and the rest scale down to 0.
  if (place <= 3) return WEEKLY_FINISH_POINTS[place];
  const tieSpot = Math.ceil(fieldSize / 2) - 1; // 0-indexed midpoint
  if (place === tieSpot) return 8;
  if (place < tieSpot) return WEEKLY_FINISH_POINTS[place];
  const remaining = fieldSize - 1 - tieSpot;
  return Math.max(0, Math.round(8 - ((place - tieSpot) * 8) / Math.max(1, remaining)));
};
