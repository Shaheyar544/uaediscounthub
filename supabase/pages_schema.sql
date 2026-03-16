-- ============================================
-- PAGES MANAGEMENT
-- ============================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  content_en TEXT,
  content_ar TEXT,
  status TEXT DEFAULT 'draft', -- 'draft' | 'published'
  placement TEXT DEFAULT 'none', -- 'none' | 'header' | 'footer_c1' | 'footer_c2' | 'footer_c3'
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  seo_title_en TEXT,
  seo_title_ar TEXT,
  seo_description_en TEXT,
  seo_description_ar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add description to categories if it doesn't exist (it wasn't in schema.sql)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description_en') THEN
    ALTER TABLE categories ADD COLUMN description_en TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description_ar') THEN
    ALTER TABLE categories ADD COLUMN description_ar TEXT;
  END IF;
END $$;
