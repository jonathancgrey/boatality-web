-- ============================================================================
-- Boatality — Enable Row Level Security + policies
-- Drafted 2026-06-10. REVIEW BEFORE RUNNING. Nothing here has been applied.
--
-- How to apply: paste into the Supabase SQL editor and run, or
--   supabase db push   (if using the CLI migrations workflow)
--
-- Design notes:
--   * creator_id on channels_v2/content_v2 and creators_v2.id are the auth
--     user's id (auth.uid()) — verified against the web app's write paths.
--   * Service-role clients (Next.js API routes, admin pages) BYPASS RLS,
--     so none of this affects the upload presign / invite / admin flows.
--   * SECURITY DEFINER functions (increment_view_count etc.) also bypass
--     RLS, so the trigger-maintained counters keep working.
--   * Tables that already had correct policies (likes, comments,
--     comment_likes, content_views, continue_watching, user_library,
--     profiles) are left alone except where noted in PHASE 3.
-- ============================================================================


-- ============================================================================
-- PHASE 1 — Active tables the apps query directly
-- ============================================================================

-- ---------- categories: public catalog, read-only from clients ----------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.categories
  FOR SELECT USING (true);

-- ---------- creators_v2: public directory, creators edit themselves ----------
ALTER TABLE public.creators_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.creators_v2
  FOR SELECT USING (true);

CREATE POLICY "Creators insert own row" ON public.creators_v2
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Creators update own row" ON public.creators_v2
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- (no client DELETE — account deletion goes through the service-role API route)

-- ---------- channels_v2: public read, creators manage their own ----------
ALTER TABLE public.channels_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.channels_v2
  FOR SELECT USING (true);

CREATE POLICY "Creators insert own channels" ON public.channels_v2
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators update own channels" ON public.channels_v2
  FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators delete own channels" ON public.channels_v2
  FOR DELETE USING (auth.uid() = creator_id);

-- ---------- content_v2: public read, creators manage their own ----------
-- NOTE: read is intentionally USING (true) because the RN app queries
-- content_v2 without a status filter. Once the app filters status='published',
-- tighten this to:
--   USING (status = 'published' OR auth.uid() = creator_id)
-- so drafts are only visible to their creator.
ALTER TABLE public.content_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.content_v2
  FOR SELECT USING (true);

CREATE POLICY "Creators insert own content" ON public.content_v2
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators update own content" ON public.content_v2
  FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators delete own content" ON public.content_v2
  FOR DELETE USING (auth.uid() = creator_id);

-- ---------- subscriptions_v2: private to each user ----------
ALTER TABLE public.subscriptions_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.subscriptions_v2
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- If you later show public subscriber counts per channel, don't open SELECT —
-- expose a counter function or a view instead, so who-follows-whom stays private.

-- ---------- users: self read/update only (contains emails) ----------
-- Rows are created by the handle_new_user trigger (SECURITY DEFINER), so no
-- client INSERT policy is needed.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- watch_history: private to each user ----------
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own watch history" ON public.watch_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- notifications: users read + mark-seen their own ----------
-- Notifications are created server-side, so no client INSERT/DELETE.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- shares: public counts, users record their own ----------
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.shares
  FOR SELECT USING (true);

CREATE POLICY "Users insert own shares" ON public.shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- PHASE 2 — Lock down legacy / unused tables
-- Enabling RLS with NO policies = no anon/authenticated access at all.
-- Service role still has full access, so nothing is lost. These are
-- candidates for DROP later; this locks them without deleting anything.
-- ============================================================================

ALTER TABLE public.channels             ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.creators             ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.podcasts             ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.episodes             ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.playlists            ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.playlist_items       ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.channel_content      ENABLE ROW LEVEL SECURITY;  -- v1
ALTER TABLE public.views                ENABLE ROW LEVEL SECURITY;  -- superseded by content_views
ALTER TABLE public.channels_backup      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_backup       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads                  ENABLE ROW LEVEL SECURITY;  -- unused ads subsystem
ALTER TABLE public.ad_campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events     ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PHASE 3 — Fix problem policies found during review
-- ============================================================================

-- A leftover hardcoded test-user backdoor on saves:
DROP POLICY IF EXISTS "Allow test user access" ON public.saves;

-- Any logged-in user could read every waitlist email. The admin panel reads
-- waitlist via the service role, which ignores RLS — so this policy is
-- unnecessary exposure. (Public INSERT stays: the signup form needs it.)
DROP POLICY IF EXISTS "authenticated can read waitlist" ON public.waitlist;

-- Redundant: profiles already has "Profiles are viewable by everyone",
-- which fully contains this narrower policy.
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.profiles;

-- ⚠️ FOLLOW-UP (not done here): profiles is world-readable and contains
-- email, date_of_birth, and gender. Cross-user reads are needed (comments
-- show other users' names/avatars), so the fix is moving private columns to
-- a separate table, or exposing a public view with only username/avatar.


-- ============================================================================
-- POST-APPLY VERIFICATION CHECKLIST (manual, in the apps)
--   RN app:  home feed loads · video/podcast/article detail screens load ·
--            like/save/comment works · subscriptions list works ·
--            continue-watching rows appear · sign-up creates profile
--   Web app: login · dashboard content list loads · upload a video ·
--            edit content metadata · branding page saves ·
--            onboarding creates channels · waitlist form still submits
-- If anything breaks, the error will be an empty result or a 401/403 from
-- PostgREST — check which table, and whether the query runs as anon
-- (not logged in) where a policy expects auth.uid().
-- ============================================================================
