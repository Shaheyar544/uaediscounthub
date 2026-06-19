-- ============================================
-- UAE DISCOUNT HUB - CORE SCHEMA
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin' | 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  icon_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STORES (Retailers)
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  logo_url TEXT,
  website_url TEXT,
  affiliate_base_url TEXT, -- e.g. "https://pboost.me/..."
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  brand TEXT,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  main_image_url TEXT,
  images TEXT[],            -- Array of additional image URLs
  base_price NUMERIC(10,2), -- MSRP or reference price
  currency TEXT DEFAULT 'AED',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  meta_title_en TEXT,
  meta_description_en TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT PRICES (Multi-store comparison)
-- ============================================
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  availability BOOLEAN DEFAULT TRUE,
  store_product_url TEXT,   -- Direct link to product in that store
  is_verified BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  discount_value NUMERIC(10,2),
  discount_type TEXT,       -- 'percent' | 'fixed'
  min_spend NUMERIC(10,2),
  max_discount NUMERIC(10,2),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEALS (Flash Sales / Specific Offers)
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  deal_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount_percent INTEGER,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AFFILIATE CLICK TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  store_id UUID REFERENCES stores(id),
  coupon_id UUID REFERENCES coupons(id),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT,
  ip_hash TEXT,           -- hashed for privacy
  user_agent TEXT,
  country TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_product ON affiliate_clicks(product_id, clicked_at DESC);

-- ============================================
-- PRICE ALERTS (User Subscriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS price_alerts (
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
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- BLOG
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
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
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES profiles(id),
  report_type TEXT NOT NULL, -- 'expired_deal' | 'broken_link' | 'submit_coupon'
  coupon_id UUID REFERENCES coupons(id),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  submitted_code TEXT,       -- for new coupon submissions
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  points_awarded INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPARISON SESSIONS (Shareable URLs)
-- ============================================
CREATE TABLE IF NOT EXISTS comparisons (
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
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
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
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  sync_type TEXT, -- 'price_update' | 'product_import'
  status TEXT,    -- 'success' | 'failed' | 'partial'
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms INTEGER,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
