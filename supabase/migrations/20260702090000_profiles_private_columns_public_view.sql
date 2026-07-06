-- Applied to production 2026-07-02 via MCP (migration: profiles_private_columns_public_view).
--
-- profiles contains email, date_of_birth, gender — stop exposing them to everyone.
-- Cross-user display needs (comments show usernames/avatars) go through a view
-- that exposes only safe columns; the base table becomes self-read-only.

create or replace view public.public_profiles as
  select id, username, avatar_url
  from public.profiles;

-- View runs with owner privileges (security_invoker = false, the default),
-- intentionally bypassing profiles RLS for these three safe columns only.
grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;

create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
