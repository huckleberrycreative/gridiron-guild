-- Change tenure_start and tenure_end from integer to text to support Week-Year format
ALTER TABLE public.coaches 
  ALTER COLUMN tenure_start TYPE TEXT USING tenure_start::TEXT,
  ALTER COLUMN tenure_end TYPE TEXT USING tenure_end::TEXT;