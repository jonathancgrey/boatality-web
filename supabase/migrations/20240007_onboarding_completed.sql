-- Add onboarding_completed flag to creators_v2.
--
-- The auto-create trigger (20240006) now creates a skeleton row the moment
-- a user signs up, so we can no longer use "row exists" to mean "onboarding done".
-- This flag is false on trigger-created rows and set to true by the finish page.

ALTER TABLE creators_v2
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all rows that existed before the trigger was added went through
-- the real onboarding flow, so mark them complete.
UPDATE creators_v2 SET onboarding_completed = true;

-- Update the trigger function to be explicit (default already handles this,
-- but being explicit makes intent clear).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.creators_v2 (id, display_name, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
