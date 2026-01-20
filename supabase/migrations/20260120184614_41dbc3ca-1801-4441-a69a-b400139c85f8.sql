-- Create rivalries table
CREATE TABLE public.rivalries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name TEXT NOT NULL,
  slogan TEXT,
  trophy_name TEXT,
  team1_governor TEXT NOT NULL,
  team2_governor TEXT NOT NULL,
  origin_story TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rivalry_matchups table
CREATE TABLE public.rivalry_matchups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rivalry_id UUID NOT NULL REFERENCES public.rivalries(id) ON DELETE CASCADE,
  season INTEGER NOT NULL,
  team1_score NUMERIC(6,2) NOT NULL,
  team2_score NUMERIC(6,2) NOT NULL,
  winner TEXT NOT NULL CHECK (winner IN ('team1', 'team2')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rivalry_id, season)
);

-- Enable RLS
ALTER TABLE public.rivalries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rivalry_matchups ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read rivalries" 
ON public.rivalries 
FOR SELECT 
USING (true);

CREATE POLICY "Public can read rivalry_matchups" 
ON public.rivalry_matchups 
FOR SELECT 
USING (true);

-- Admin policies for rivalries
CREATE POLICY "Admins can insert rivalries" 
ON public.rivalries 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rivalries" 
ON public.rivalries 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rivalries" 
ON public.rivalries 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for rivalry_matchups
CREATE POLICY "Admins can insert rivalry_matchups" 
ON public.rivalry_matchups 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rivalry_matchups" 
ON public.rivalry_matchups 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rivalry_matchups" 
ON public.rivalry_matchups 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_rivalry_matchups_rivalry_id ON public.rivalry_matchups(rivalry_id);
CREATE INDEX idx_rivalry_matchups_season ON public.rivalry_matchups(season);