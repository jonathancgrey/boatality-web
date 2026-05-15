-- Add settings columns to creators_v2
-- notification_prefs: JSONB storing per-topic email preferences
-- is_public: whether the creator profile is publicly visible
-- listed_in_directory: whether the creator appears in the discover/directory listing

ALTER TABLE creators_v2
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT '{"platform_updates": true, "new_follower": true, "performance_summaries": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS listed_in_directory BOOLEAN NOT NULL DEFAULT true;
