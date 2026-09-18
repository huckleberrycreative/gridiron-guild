ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS espn_team_id integer;
CREATE UNIQUE INDEX IF NOT EXISTS teams_espn_team_id_key ON public.teams (espn_team_id) WHERE espn_team_id IS NOT NULL;