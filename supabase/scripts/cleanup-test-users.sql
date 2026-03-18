-- =============================================================================
-- Boatality: Clean up test users for fresh onboarding
-- Run this in Supabase → SQL Editor (requires service role access)
-- =============================================================================
-- Emails to delete (case-insensitive):
--   jonathan.c.greviskis@gmail.com
--   jgreviskis@gmail.com
--   jonathan@boatality.com
--   jonathan.c.grey@gmail.com
-- =============================================================================

DO $$
DECLARE
  test_emails TEXT[] := ARRAY[
    'jonathan.c.greviskis@gmail.com',
    'jgreviskis@gmail.com',
    'jonathan@boatality.com',
    'jonathan.c.grey@gmail.com'
  ];
  r RECORD;
  creator_id UUID;
BEGIN

  -- -----------------------------------------------------------------------
  -- 1. For each auth user matching the test emails, cascade-delete app data
  -- -----------------------------------------------------------------------
  FOR r IN
    SELECT id, email
    FROM auth.users
    WHERE lower(email) = ANY(SELECT lower(unnest(test_emails)))
  LOOP
    RAISE NOTICE 'Processing auth user: % (%)', r.email, r.id;

    -- Grab their creator row (if any)
    SELECT id INTO creator_id
    FROM public.creators_v2
    WHERE auth_user_id = r.id;

    IF creator_id IS NOT NULL THEN
      RAISE NOTICE '  Found creator row: %', creator_id;

      -- Delete content under their channels
      DELETE FROM public.content_v2
      WHERE channel_id IN (
        SELECT id FROM public.channels_v2 WHERE creator_id = creator_id
      );

      -- Delete their channels
      DELETE FROM public.channels_v2 WHERE creator_id = creator_id;

      -- Delete creator row
      DELETE FROM public.creators_v2 WHERE id = creator_id;

      RAISE NOTICE '  Deleted creator + channels + content';
    ELSE
      RAISE NOTICE '  No creator row found';
    END IF;

    -- Delete the auth user (Supabase cascades to identities / sessions / tokens)
    DELETE FROM auth.users WHERE id = r.id;
    RAISE NOTICE '  Deleted auth.users row';
  END LOOP;

  -- -----------------------------------------------------------------------
  -- 2. Delete beta_signups rows for these emails (catches any orphaned rows)
  -- -----------------------------------------------------------------------
  DELETE FROM public.beta_signups
  WHERE lower(email) = ANY(SELECT lower(unnest(test_emails)));

  RAISE NOTICE 'Done. beta_signups rows cleared.';

END $$;
