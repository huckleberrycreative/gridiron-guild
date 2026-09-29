CREATE TABLE public.captain_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL,
  week integer NOT NULL,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_year, week, team_id)
);
GRANT SELECT ON public.captain_picks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.captain_picks TO authenticated;
GRANT ALL ON public.captain_picks TO service_role;
ALTER TABLE public.captain_picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view captain picks" ON public.captain_picks FOR SELECT USING (true);
CREATE POLICY "Admins insert captain picks" ON public.captain_picks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update captain picks" ON public.captain_picks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete captain picks" ON public.captain_picks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_captain_picks_updated_at BEFORE UPDATE ON public.captain_picks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.player_week_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year integer NOT NULL,
  week integer NOT NULL,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  points numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season_year, week, player_id)
);
GRANT SELECT ON public.player_week_scores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.player_week_scores TO authenticated;
GRANT ALL ON public.player_week_scores TO service_role;
ALTER TABLE public.player_week_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view player week scores" ON public.player_week_scores FOR SELECT USING (true);
CREATE POLICY "Admins write player week scores" ON public.player_week_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_player_week_scores_updated_at BEFORE UPDATE ON public.player_week_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();