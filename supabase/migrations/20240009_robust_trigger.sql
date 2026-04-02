-- Make the auto-create trigger exception-safe.
-- If anything goes wrong creating the creators_v2 row, we log it and continue
-- rather than crashing the entire auth.users INSERT (which shows as
-- "database error saving new user" in the Supabase admin API).

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

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block the auth user creation
  RAISE WARNING 'handle_new_user failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
