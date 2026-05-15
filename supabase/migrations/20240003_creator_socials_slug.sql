-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: creator_socials_slug
--
-- Adds @handle (slug) and social link columns to creators_v2
-- so creators can set their public profile URL and link out to their platforms.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.creators_v2
  ADD COLUMN IF NOT EXISTS slug            text UNIQUE,
  ADD COLUMN IF NOT EXISTS website_url     text,
  ADD COLUMN IF NOT EXISTS youtube_url     text,
  ADD COLUMN IF NOT EXISTS instagram_url   text,
  ADD COLUMN IF NOT EXISTS tiktok_url      text;

-- Optional: index for fast lookups by handle
CREATE UNIQUE INDEX IF NOT EXISTS creators_v2_slug_idx ON public.creators_v2 (slug);
