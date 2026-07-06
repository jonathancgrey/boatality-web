-- Applied to production 2026-07-02 via MCP (migration: comment_share_counters_target_content_v2).
--
-- Comment/share counter triggers were still updating the legacy `content`
-- table, so content_v2 counters never moved (and the RN app's rpc("increment")
-- call targeted a function that doesn't exist). Point them at content_v2
-- and backfill from source-of-truth tables.

create or replace function public.increment_comment_count()
returns trigger language plpgsql security definer as $$
begin
  update public.content_v2
  set comment_count = coalesce(comment_count, 0) + 1
  where id = new.content_id;
  return new;
end $$;

create or replace function public.decrement_comment_count()
returns trigger language plpgsql security definer as $$
begin
  update public.content_v2
  set comment_count = greatest(coalesce(comment_count, 1) - 1, 0)
  where id = old.content_id;
  return old;
end $$;

create or replace function public.increment_share_count()
returns trigger language plpgsql security definer as $$
begin
  update public.content_v2
  set share_count = coalesce(share_count, 0) + 1
  where id = new.content_id;
  return new;
end $$;

create or replace function public.decrement_share_count()
returns trigger language plpgsql security definer as $$
begin
  update public.content_v2
  set share_count = greatest(coalesce(share_count, 1) - 1, 0)
  where id = old.content_id;
  return old;
end $$;

-- Backfill so counters reflect reality
update public.content_v2 c
set comment_count = (select count(*) from public.comments m where m.content_id = c.id);

update public.content_v2 c
set share_count = (select count(*) from public.shares s where s.content_id = c.id);
