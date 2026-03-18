-- ============================================================
-- Price history table, product pros/cons, asin, coupon sync
-- ============================================================

-- FIX 5E: asin on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS asin TEXT;

-- FIX 6: pros / cons arrays on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS pros TEXT[],
  ADD COLUMN IF NOT EXISTS cons TEXT[];

-- FIX 7C: product_id + source on coupons
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- FIX 5A: price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID REFERENCES products(id)  ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id)    ON DELETE SET NULL,
  asin        TEXT,
  price       DECIMAL(10,2) NOT NULL,
  currency    TEXT DEFAULT 'AED',
  source      TEXT DEFAULT 'manual',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ph_product
  ON price_history(product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ph_store
  ON price_history(store_id);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'price_history'
      AND policyname = 'Public can read price history'
  ) THEN
    CREATE POLICY "Public can read price history"
      ON price_history FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'price_history'
      AND policyname = 'Authenticated full access price history'
  ) THEN
    CREATE POLICY "Authenticated full access price history"
      ON price_history FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  END IF;
END $$;
