-- FIX 2: Add source column if missing
ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- FIX 1: RLS policies for price_history
DROP POLICY IF EXISTS "Public can read price history" ON price_history;
CREATE POLICY "Public can read price history"
  ON price_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated full access price history" ON price_history;
CREATE POLICY "Authenticated full access price history"
  ON price_history FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
