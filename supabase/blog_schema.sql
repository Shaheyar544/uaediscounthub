-- CATEGORIES
CREATE TABLE blog_categories (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  slug      text UNIQUE NOT NULL,
  color     text,
  icon      text,
  parent_id uuid REFERENCES blog_categories(id)
);

-- TAGS
CREATE TABLE blog_tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL
);

-- POSTS
CREATE TABLE blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  subtitle         text,
  slug             text UNIQUE NOT NULL,
  content          text NOT NULL,
  excerpt          text,
  featured_image   text,
  og_image         text,
  status           text DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled','archived')),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  author_id        uuid REFERENCES auth.users(id),
  category_id      uuid REFERENCES blog_categories(id),
  reading_time_min int,
  view_count       int DEFAULT 0,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  canonical_url    text,
  schema_type      text DEFAULT 'Article',
  is_featured      boolean DEFAULT false,
  allow_comments   boolean DEFAULT true,
  locale           text DEFAULT 'en',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- POST TAGS JUNCTION
CREATE TABLE blog_post_tags (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  uuid REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- IMAGE GALLERY
CREATE TABLE blog_post_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt_text   text,
  width      int,
  height     int,
  size_kb    int,
  sort_order int DEFAULT 0
);

-- AD WIDGETS
CREATE TABLE blog_ad_widgets (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  position  text NOT NULL, -- sidebar-top | sidebar-mid | sidebar-bottom | in-article
  html_code text,
  image_url text,
  link_url  text,
  title     text,
  cta_text  text,
  is_active boolean DEFAULT true,
  start_at  timestamptz,
  end_at    timestamptz
);

-- INDEXES
CREATE INDEX ON blog_posts(slug);
CREATE INDEX ON blog_posts(status);
CREATE INDEX ON blog_posts(category_id);
CREATE INDEX ON blog_posts(published_at DESC);
CREATE INDEX ON blog_posts(is_featured);

-- AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins full access" ON blog_posts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
