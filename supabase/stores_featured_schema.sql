-- ============================================
-- STORES ENHANCEMENTS
-- ============================================
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='is_featured') THEN
    ALTER TABLE stores ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='display_order') THEN
    ALTER TABLE stores ADD COLUMN display_order INTEGER DEFAULT 0;
  END IF;
END $$;
