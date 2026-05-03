DROP POLICY IF EXISTS "Anyone can update draft_picks" ON public.draft_picks;
DROP POLICY IF EXISTS "Anyone can insert draft_picks" ON public.draft_picks;
CREATE POLICY "Admins can update draft_picks" ON public.draft_picks FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert draft_picks" ON public.draft_picks FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));