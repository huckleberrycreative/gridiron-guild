import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEASON_YEAR } from '@/hooks/useWeeklyScores';

export type ProjectedScore = {
  week: number;
  teamId: string;
  projected: number;
  live: number | null;
  updatedAt: string;
};

/** Tentative totals for the in-progress week, saved by the latest ESPN refresh. */
export const useProjectedScores = (seasonYear: number = SEASON_YEAR) =>
  useQuery({
    queryKey: ['weekly-scores', 'projected', seasonYear],
    queryFn: async (): Promise<ProjectedScore[]> => {
      const { data, error } = await supabase
        .from('projected_weekly_scores')
        .select('week, team_id, projected, live_score, updated_at')
        .eq('season_year', seasonYear);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        week: r.week,
        teamId: r.team_id,
        projected: Number(r.projected),
        live: r.live_score == null ? null : Number(r.live_score),
        updatedAt: r.updated_at,
      }));
    },
  });
