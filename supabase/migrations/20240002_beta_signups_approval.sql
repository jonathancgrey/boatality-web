-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: beta_signups approval columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.beta_signups
  ADD COLUMN IF NOT EXISTS invited_at  timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes       text;        -- optional admin notes per signup

-- Ensure status has a sensible default and constraint
ALTER TABLE public.beta_signups
  ALTER COLUMN status SET DEFAULT 'pending';

-- Index for fast filtering by status in the admin panel
CREATE INDEX IF NOT EXISTS beta_signups_status_idx ON public.beta_signups (status);
