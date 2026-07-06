-- Applied to production 2026-07-06 via MCP (migration: referral_founding_analytics_infra).
-- Referral infrastructure + Founding Creator flag + analytics event ingestion.
-- (Launch Roadmap 0.3 / 0.4: referral links, founding badge, analytics events)

alter table public.creators_v2
  add column if not exists referral_code text unique,
  add column if not exists is_founding boolean not null default false;

update public.creators_v2
set referral_code = coalesce(nullif(slug, ''), left(replace(id::text, '-', ''), 8))
where referral_code is null;

create or replace function public.assign_referral_code()
returns trigger language plpgsql security definer as $$
begin
  if new.referral_code is null then
    new.referral_code := coalesce(nullif(new.slug, ''), left(replace(new.id::text, '-', ''), 8));
    if exists (select 1 from public.creators_v2 where referral_code = new.referral_code and id <> new.id) then
      new.referral_code := new.referral_code || '-' || left(replace(new.id::text, '-', ''), 4);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists set_referral_code on public.creators_v2;
create trigger set_referral_code
  before insert on public.creators_v2
  for each row execute function public.assign_referral_code();

alter table public.beta_signups
  add column if not exists referred_by_code text;

create index if not exists beta_signups_referred_by_idx on public.beta_signups (referred_by_code);

create or replace view public.referral_leaderboard as
select c.id as creator_id, c.display_name, c.referral_code,
       count(b.id) as attributed_signups
from public.creators_v2 c
left join public.beta_signups b on b.referred_by_code = c.referral_code
group by c.id, c.display_name, c.referral_code
order by attributed_signups desc;

create or replace view public.founding_spots as
select 25 - count(*) as spots_remaining, count(*) as founding_signed
from public.creators_v2 where is_founding = true;

grant select on public.founding_spots to anon, authenticated;

create policy "Users insert own events" on public.analytics_events
  for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);

create policy "Anon insert events" on public.analytics_events
  for insert to anon
  with check (user_id is null);
