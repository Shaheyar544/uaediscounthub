-- ============================================================
-- PHASE 2: Product Admin Overhaul Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Add missing columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
  CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Add currency column (required by insert logic, may already exist)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'AED';

-- Note: images, is_featured, view_count, name_ar, description_ar already exist

-- Step 2: Create product_store_prices table for multi-store comparison
CREATE TABLE IF NOT EXISTS product_store_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percent INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN original_price IS NOT NULL AND original_price > 0 AND original_price > price
      THEN ROUND(((original_price - price) / original_price * 100))::INTEGER
      ELSE 0
    END
  ) STORED,
  affiliate_url TEXT NOT NULL,
  coupon_code TEXT,
  coupon_discount TEXT,
  in_stock BOOLEAN DEFAULT true,
  is_best_price BOOLEAN DEFAULT false,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, store_id)
);

-- Step 3: Enable RLS
ALTER TABLE product_store_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can read prices"
ON product_store_prices FOR SELECT
USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated full access prices"
ON product_store_prices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Performance indexes
CREATE INDEX IF NOT EXISTS idx_psp_product ON product_store_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_psp_store ON product_store_prices(store_id);
CREATE INDEX IF NOT EXISTS idx_psp_best_price ON product_store_prices(product_id, is_best_price);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(is_trending);
