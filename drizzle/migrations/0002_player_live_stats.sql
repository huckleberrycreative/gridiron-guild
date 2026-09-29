ALTER TABLE public.player_salaries
  ADD COLUMN IF NOT EXISTS actual_ppg numeric,
  ADD COLUMN IF NOT EXISTS games_played integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS espn_proj_ppg numeric,
  ADD COLUMN IF NOT EXISTS stats_updated_at timestamptz;