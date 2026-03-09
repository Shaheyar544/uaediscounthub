-- ============================================
-- USERS & PROFILES (SYNC WITH AUTH.USERS)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en', -- 'en' | 'ar'
  country_code TEXT DEFAULT 'AE', -- ISO: AE, SA, QA...
  preferred_currency TEXT DEFAULT 'AED',
  points INTEGER DEFAULT 0, -- gamification
  role TEXT DEFAULT 'user', -- 'user' | 'editor' | 'admin'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to sync auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_slug TEXT NOT NULL, -- 'deal-hunter', 'top-contributor'
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORES / MARKETPLACES
-- ============================================
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'amazon-ae', 'noon', 'sharaf-dg'
  name TEXT NOT NULL,
  logo_url TEXT,
  base_url TEXT NOT NULL,
  affiliate_base_url TEXT, -- affiliate tracking base
  supports_cod BOOLEAN DEFAULT TRUE,
  supports_tabby BOOLEAN DEFAULT TRUE,
  supports_tamara BOOLEAN DEFAULT TRUE,
  countries TEXT[] DEFAULT '{AE,SA,QA,KW,BH,OM}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- BRANDS
-- ============================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  country_origin TEXT
);

-- ============================================
-- PRODUCTS (Core Table)
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  description_en TEXT,
  description_ar TEXT,
  ai_summary_en TEXT,      -- DeepSeek generated
  ai_summary_ar TEXT,      -- DeepSeek generated
  ai_pros JSONB,           -- ["Fast processor", "Great battery"]
  ai_cons JSONB,
  specifications JSONB,    -- { "RAM": "8GB", "Storage": "256GB" }
  spec_tags JSONB,         -- [{"icon":"battery","label":"5000mAh"}]
  images JSONB,            -- [{url, alt_en, alt_ar, is_primary}]
  has_360_view BOOLEAN DEFAULT FALSE,
  in_box_contents JSONB,   -- ["USB-C Cable", "Adapter", "Case"]
  product_videos JSONB,    -- For embedded YouTube/TikTok review clips
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  -- Compatibility Columns
  name TEXT GENERATED ALWAYS AS (name_en) STORED,
  image_url TEXT,
  base_price NUMERIC(10,2),
  seo_title_en TEXT,
  seo_title_ar TEXT,
  seo_description_en TEXT,
  seo_description_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================
-- PRODUCT PRICES (Per Store)
-- ============================================
CREATE TABLE product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  store_product_url TEXT NOT NULL,   -- direct product URL on store
  affiliate_url TEXT,                -- cloaked /go/ URL
  current_price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  currency TEXT DEFAULT 'AED',
  discount_percent NUMERIC(5,2),
  monthly_installment NUMERIC(10,2), -- for Tabby/Tamara calculations
  in_stock BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- ============================================
-- PRICE HISTORY (For Charts)
-- ============================================
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id, store_id, recorded_at DESC);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  discount_type TEXT DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value NUMERIC(10,2),
  min_order_value NUMERIC(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_exclusive BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES profiles(id), -- community submitted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEALS
-- ============================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  deal_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2),
  affiliate_url TEXT NOT NULL,
  badge_text TEXT,         -- "Flash Sale", "Today Only"
  is_flash_sale BOOLEAN DEFAULT FALSE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AFFILIATE CLICK TRACKING
-- ============================================
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  coupon_id UUID REFERENCES coupons(id),
  deal_id UUID REFERENCES deals(id),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  ip_hash TEXT,           -- hashed for privacy
  user_agent TEXT,
  country TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_product ON affiliate_clicks(product_id, clicked_at DESC);

-- ============================================
-- PRICE ALERTS (User Subscriptions)
-- ============================================
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  target_price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  alert_via TEXT DEFAULT 'email', -- 'email' | 'whatsapp' | 'push'
  whatsapp_number TEXT,
  is_triggered BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WISHLISTS
-- ============================================
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- BLOG
-- ============================================
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  content_en TEXT,
  content_ar TEXT,
  excerpt_en TEXT,
  excerpt_ar TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id),
  category_id UUID REFERENCES categories(id),
  tags TEXT[],
  post_type TEXT DEFAULT 'article', -- 'review' | 'guide' | 'comparison' | 'listicle'
  seo_title_en TEXT,
  seo_description_en TEXT,
  schema_faq JSONB,         -- JSON-LD FAQ schema data
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY DEAL REPORTS (Gamification)
-- ============================================
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL, -- 'expired_deal' | 'broken_link' | 'submit_coupon'
  coupon_id UUID REFERENCES coupons(id),
  deal_id UUID REFERENCES deals(id),
  submitted_code TEXT,       -- for new coupon submissions
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  points_awarded INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPARISON SESSIONS (Shareable URLs)
-- ============================================
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_hash TEXT UNIQUE NOT NULL, -- short unique hash e.g. "abc12x"
  product_ids UUID[] NOT NULL,
  created_by UUID REFERENCES profiles(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  country TEXT DEFAULT 'AE',
  tags TEXT[],
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- API SYNC LOGS (Admin Monitoring)
-- ============================================
CREATE TABLE api_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  sync_type TEXT, -- 'price_update' | 'product_import'
  status TEXT,    -- 'success' | 'failed' | 'partial'
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
