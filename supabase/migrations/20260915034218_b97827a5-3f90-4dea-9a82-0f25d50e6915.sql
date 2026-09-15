ALTER TABLE public.player_salaries
  ADD COLUMN IF NOT EXISTS injury_status text NOT NULL DEFAULT 'healthy',
  ADD COLUMN IF NOT EXISTS injury_weeks_out integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS injury_note text;