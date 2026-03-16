-- ============================================================
-- RPC: increment_coupon_clicks
-- Safe atomic counter increment — run this in Supabase SQL editor
-- ============================================================
CREATE OR REPLACE FUNCTION increment_coupon_clicks(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET click_count = click_count + 1
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- RPC: get_coupon_trust_score
-- Returns trust % for a given store (% of coupons verified)
-- ============================================================
CREATE OR REPLACE FUNCTION get_coupon_trust_score(p_store_id UUID)
RETURNS TABLE(trust_score INTEGER, total_coupons INTEGER, verified_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN COUNT(*) > 0
      THEN ROUND((SUM(CASE WHEN is_verified THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100)::INTEGER
      ELSE 0
    END AS trust_score,
    COUNT(*)::INTEGER AS total_coupons,
    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END)::INTEGER AS verified_count
  FROM coupons
  WHERE store_id = p_store_id
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- VIEW: coupons_with_trust
-- Materializes coupon + store data for efficient listing page
-- ============================================================
CREATE OR REPLACE VIEW coupons_with_trust AS
SELECT
  c.id,
  c.code,
  c.title_en,
  c.title_ar,
  c.description_en,
  c.discount_type,
  c.discount_value,
  c.min_order_value,
  c.max_uses,
  c.current_uses,
  c.is_verified,
  c.is_exclusive,
  c.expires_at,
  c.click_count,
  c.created_at,
  s.id AS store_id,
  s.slug AS store_slug,
  s.name AS store_name,
  s.logo_url AS store_logo_url,
  s.affiliate_base_url,
  s.base_url
FROM coupons c
JOIN stores s ON c.store_id = s.id
WHERE c.is_active = TRUE
  AND s.is_active = TRUE;


-- ============================================================
-- INDEX: Boost coupon listing queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coupons_active_store
  ON coupons(store_id, is_active, is_verified, click_count DESC);

CREATE INDEX IF NOT EXISTS idx_coupons_expires
  ON coupons(expires_at)
  WHERE expires_at IS NOT NULL;


-- ============================================================
-- ROW LEVEL SECURITY POLICY: Public read, admin write
-- ============================================================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active coupons
DROP POLICY IF EXISTS "Public read active coupons" ON coupons;
CREATE POLICY "Public read active coupons" ON coupons
  FOR SELECT USING (is_active = TRUE);

-- Allow authenticated admins to manage coupons
DROP POLICY IF EXISTS "Admin full access coupons" ON coupons;
CREATE POLICY "Admin full access coupons" ON coupons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'editor')
    )
  );
