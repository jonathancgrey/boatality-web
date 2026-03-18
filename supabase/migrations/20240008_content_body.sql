-- Add a body column to content_v2 for storing full article text.
-- description remains a short summary field for all content types.
-- body is only populated for articles (type = 'article').

ALTER TABLE content_v2
  ADD COLUMN IF NOT EXISTS body TEXT;
