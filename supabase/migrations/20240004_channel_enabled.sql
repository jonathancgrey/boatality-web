-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: channel_enabled
--
-- Adds an `enabled` boolean to channels_v2 so creators can turn channel
-- types on/off without losing their content or branding assets.
-- Existing rows default to true (already active).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.channels_v2
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true;
