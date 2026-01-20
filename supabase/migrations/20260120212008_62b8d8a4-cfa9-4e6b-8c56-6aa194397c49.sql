-- Add season and week fields to blog_posts for Weekly Recaps
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS season_year INTEGER,
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS recap_date DATE;

-- Add index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_blog_posts_recap_date ON public.blog_posts(recap_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_season_week ON public.blog_posts(season_year DESC, week_number DESC);