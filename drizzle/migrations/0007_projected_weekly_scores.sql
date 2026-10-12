CREATE TABLE public.projected_weekly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL,
  week integer NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  projected numeric NOT NULL,
  live_score numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_year, week, team_id)
);
GRANT SELECT ON public.projected_weekly_scores TO anon, authenticated;
GRANT ALL ON public.projected_weekly_scores TO service_role;
ALTER TABLE public.projected_weekly_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projections are public" ON public.projected_weekly_scores FOR SELECT TO anon, authenticated USING (true);