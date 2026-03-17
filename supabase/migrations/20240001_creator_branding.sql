-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: creator_branding
--
-- 1. Add avatar_url / banner_url columns to creators_v2 (if not already present)
-- 2. Add avatar_url / banner_url columns to channels_v2  (if not already present)
-- 3. Create the "creator-media" Storage bucket (public, 5 MB limit)
-- 4. RLS policy: authenticated users may upload/read their own branding objects
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. creators_v2 branding columns ─────────────────────────────────────────
ALTER TABLE public.creators_v2
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ── 2. channels_v2 branding columns ─────────────────────────────────────────
ALTER TABLE public.channels_v2
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- ── 3. Storage bucket ────────────────────────────────────────────────────────
-- Run this in the Supabase dashboard SQL editor or via the Storage API.
-- The SQL function below is the programmatic equivalent:
--
--   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES (
--     'creator-media',
--     'creator-media',
--     true,                          -- public reads (signed URLs still required for private use)
--     5242880,                       -- 5 MB per file
--     ARRAY['image/jpeg','image/png','image/webp','image/gif']
--   )
--   ON CONFLICT (id) DO NOTHING;

-- ── 4. Storage RLS policies ──────────────────────────────────────────────────
--
-- Allow authenticated users to INSERT objects whose path starts with
-- "branding/{their_user_id}/"
--
CREATE POLICY "Creators can upload their own branding"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = 'branding'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

--
-- Allow authenticated users to UPDATE/DELETE their own branding objects
--
CREATE POLICY "Creators can update their own branding"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = 'branding'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Creators can delete their own branding"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'creator-media'
    AND (storage.foldername(name))[1] = 'branding'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

--
-- Allow public read access (bucket is public, but explicit policy is safer)
--
CREATE POLICY "Public read access for creator-media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'creator-media');
