-- Deals table enhancement: add columns needed for Amazon Deals scraper

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS asin             TEXT,
  ADD COLUMN IF NOT EXISTS source           TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS image_url        TEXT,
  ADD COLUMN IF NOT EXISTS title_en         TEXT,
  ADD COLUMN IF NOT EXISTS final_price      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS coupon_value     TEXT,
  ADD COLUMN IF NOT EXISTS coupon_type      TEXT CHECK (coupon_type IN ('percentage', 'fixed', NULL)),
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER,
  ADD COLUMN IF NOT EXISTS affiliate_url    TEXT,
  ADD COLUMN IF NOT EXISTS expires_at       TIMESTAMPTZ;

-- Index for ASIN lookups (dedup on import)
CREATE INDEX IF NOT EXISTS deals_asin_idx ON public.deals (asin) WHERE asin IS NOT NULL;

-- Index for active deals sorted by discount
CREATE INDEX IF NOT EXISTS deals_active_discount_idx ON public.deals (discount_percent DESC) WHERE is_active = true;
