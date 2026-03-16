-- ============================================
-- GLOBAL SITE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensure only one row exists
  
  -- General Identity
  site_name TEXT DEFAULT 'UAEDISCOUNTHUB',
  primary_domain TEXT DEFAULT 'https://uaediscounthub.com',
  
  -- Promotions & Announcements
  enable_top_bar BOOLEAN DEFAULT TRUE,
  announcement_text TEXT,
  promo_code TEXT,
  countdown_end_date TIMESTAMPTZ,
  
  -- Integrations (Affiliate & AI)
  amazon_associate_id TEXT,
  noon_affiliate_id TEXT,
  sharaf_dg_partner_key TEXT,
  carrefour_tracking_id TEXT,
  deepseek_api_key TEXT, -- Encrypted or handled via env normally
  
  -- Social & Contact
  whatsapp_number TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  
  -- Localization
  default_currency TEXT DEFAULT 'AED',
  target_regions TEXT[] DEFAULT '{UAE,KSA,GCC}',
  
  -- System Controls
  maintenance_mode BOOLEAN DEFAULT FALSE,
  newsletter_auto_sync BOOLEAN DEFAULT TRUE,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial seed for settings
INSERT INTO site_settings (id, site_name) 
VALUES (1, 'UAEDISCOUNTHUB')
ON CONFLICT (id) DO NOTHING;
