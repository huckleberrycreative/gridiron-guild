DROP POLICY IF EXISTS "Admins can update draft_picks" ON public.draft_picks;
DROP POLICY IF EXISTS "Admins can insert draft_picks" ON public.draft_picks;
CREATE POLICY "Anyone can update draft_picks" ON public.draft_picks FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert draft_picks" ON public.draft_picks FOR INSERT WITH CHECK (true);