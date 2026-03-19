-- ============================================================
-- site_settings — singleton row (id = 'global')
-- ============================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id                    TEXT        PRIMARY KEY DEFAULT 'global',

  -- General Identity
  site_name             TEXT        NOT NULL DEFAULT 'UAEDiscountHub',
  primary_domain        TEXT        NOT NULL DEFAULT 'https://uaediscounthub.com',
  site_description      TEXT        DEFAULT '',
  logo_url              TEXT        DEFAULT '',
  favicon_url           TEXT        DEFAULT '',
  contact_email         TEXT        DEFAULT 'hello@uaediscounthub.com',

  -- Social
  whatsapp_number       TEXT        DEFAULT '',
  twitter_url           TEXT        DEFAULT '',
  linkedin_url          TEXT        DEFAULT '',
  instagram_url         TEXT        DEFAULT '',

  -- Flash Banner
  banner_enabled        BOOLEAN     DEFAULT true,
  banner_text           TEXT        DEFAULT 'Flash Sale – Up to 30% off on Smartphones!',
  banner_promo_code     TEXT        DEFAULT 'TECH30',
  banner_countdown      TEXT        DEFAULT '',
  banner_color          TEXT        DEFAULT '#EF4444',
  banner_icon           TEXT        DEFAULT '🔥',
  banner_link           TEXT        DEFAULT '',

  -- SEO & Analytics
  meta_title_template   TEXT        DEFAULT '%s | UAEDiscountHub',
  meta_description      TEXT        DEFAULT 'Find the best tech deals in UAE. Compare prices across Amazon UAE, Noon, Sharaf DG and more.',
  og_image_url          TEXT        DEFAULT '',
  google_analytics_id   TEXT        DEFAULT '',
  google_search_console TEXT        DEFAULT '',
  robots_txt            TEXT        DEFAULT E'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://uaediscounthub.com/sitemap.xml',

  -- Email & Notifications
  from_email            TEXT        DEFAULT 'alerts@uaediscounthub.com',
  from_name             TEXT        DEFAULT 'UAEDiscountHub',
  sendpulse_list_id     TEXT        DEFAULT '',

  -- Integrations (affiliate IDs only, never API secrets)
  amazon_associate_id   TEXT        DEFAULT 'uaediscount-21',
  noon_affiliate_id     TEXT        DEFAULT '',
  sharaf_dg_partner_key TEXT        DEFAULT '',
  carrefour_tracking_id TEXT        DEFAULT '',

  -- Localization
  default_currency      TEXT        DEFAULT 'AED',
  target_regions        TEXT[]      DEFAULT ARRAY['UAE'],

  -- System
  maintenance_mode      BOOLEAN     DEFAULT false,
  newsletter_auto_sync  BOOLEAN     DEFAULT true,

  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Seed singleton
INSERT INTO public.site_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'site_settings_updated_at'
  ) THEN
    CREATE TRIGGER site_settings_updated_at
      BEFORE UPDATE ON public.site_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT (server components read banner/social links)
DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
CREATE POLICY "site_settings_select"
  ON public.site_settings FOR SELECT
  USING (true);

-- Admin-JWT UPDATE only (singleton — no INSERT/DELETE needed)
DROP POLICY IF EXISTS "site_settings_update" ON public.site_settings;
CREATE POLICY "site_settings_update"
  ON public.site_settings FOR UPDATE TO authenticated
  USING  ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
