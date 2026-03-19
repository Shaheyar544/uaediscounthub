-- Categories Enhancement: add logo_url, icon_emoji, color, meta_title, meta_description
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS icon_emoji       TEXT,
  ADD COLUMN IF NOT EXISTS color            TEXT DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS meta_title       TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT;
