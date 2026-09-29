DROP POLICY IF EXISTS "Authenticated users can manage page content" ON public.page_content;
CREATE POLICY "Admins can manage page content" ON public.page_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));