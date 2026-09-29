DROP POLICY IF EXISTS "Authenticated users can delete coach images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update coach images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload coach images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete governor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update governor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload governor images" ON storage.objects;
CREATE POLICY "Admins can upload coach/governor images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('coach-images','governor-images') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update coach/governor images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('coach-images','governor-images') AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id IN ('coach-images','governor-images') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete coach/governor images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('coach-images','governor-images') AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update media files" ON storage.objects;
CREATE POLICY "Admins can update media files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));