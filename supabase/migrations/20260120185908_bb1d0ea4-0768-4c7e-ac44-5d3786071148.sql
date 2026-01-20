-- Create rookie_pool table for storing available rookies each year
CREATE TABLE public.rookie_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_year INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  position TEXT NOT NULL,
  college TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create draft_picks table for storing pick ownership and selections
CREATE TABLE public.draft_picks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_year INTEGER NOT NULL,
  round INTEGER NOT NULL CHECK (round >= 1 AND round <= 3),
  pick_number INTEGER NOT NULL CHECK (pick_number >= 1 AND pick_number <= 10),
  team_id UUID REFERENCES public.teams(id),
  selected_player_id UUID REFERENCES public.rookie_pool(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(draft_year, round, pick_number)
);

-- Enable RLS
ALTER TABLE public.rookie_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_picks ENABLE ROW LEVEL SECURITY;

-- RLS policies for rookie_pool
CREATE POLICY "Public can read rookie_pool" 
ON public.rookie_pool 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert rookie_pool" 
ON public.rookie_pool 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rookie_pool" 
ON public.rookie_pool 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rookie_pool" 
ON public.rookie_pool 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for draft_picks
CREATE POLICY "Public can read draft_picks" 
ON public.draft_picks 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert draft_picks" 
ON public.draft_picks 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update draft_picks" 
ON public.draft_picks 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete draft_picks" 
ON public.draft_picks 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_rookie_pool_draft_year ON public.rookie_pool(draft_year);
CREATE INDEX idx_rookie_pool_position ON public.rookie_pool(position);
CREATE INDEX idx_draft_picks_draft_year ON public.draft_picks(draft_year);
CREATE INDEX idx_draft_picks_selected_player ON public.draft_picks(selected_player_id);