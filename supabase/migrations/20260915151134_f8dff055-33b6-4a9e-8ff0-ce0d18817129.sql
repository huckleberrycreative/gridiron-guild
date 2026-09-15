CREATE TABLE public.weekly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL DEFAULT 2026,
  week integer NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (season_year, week, team_id)
);

GRANT SELECT ON public.weekly_scores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_scores TO authenticated;
GRANT ALL ON public.weekly_scores TO service_role;

ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly scores are viewable by everyone"
ON public.weekly_scores FOR SELECT USING (true);

CREATE POLICY "Admins can insert weekly scores"
ON public.weekly_scores FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update weekly scores"
ON public.weekly_scores FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete weekly scores"
ON public.weekly_scores FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_weekly_scores_updated_at
BEFORE UPDATE ON public.weekly_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();