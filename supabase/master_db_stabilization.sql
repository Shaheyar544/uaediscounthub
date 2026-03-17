-- MASTER DATABASE STABILIZATION SCRIPT v3
-- RUN THIS IN THE SUPABASE SQL EDITOR TO FIX MISSING COLUMNS AND RLS POLICIES

-- ============================================
-- 1. STORES TABLE ENHANCEMENTS
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

-- ============================================
-- 2. CATEGORIES TABLE ENHANCEMENTS
-- ============================================
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description_en') THEN
    ALTER TABLE categories ADD COLUMN description_en TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='description_ar') THEN
    ALTER TABLE categories ADD COLUMN description_ar TEXT;
  END IF;
END $$;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- These policies enable Row Level Security and allow authenticated admins 
-- to manage the core data tables while allowing public read access.

-- Helper: Enable RLS on all public tables (idempotent)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3a. STORES POLICIES
DROP POLICY IF EXISTS "Public read stores" ON stores;
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access stores" ON stores;
CREATE POLICY "Admin full access stores" ON stores FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- 3b. CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access categories" ON categories;
CREATE POLICY "Admin full access categories" ON categories FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- 3c. PRODUCTS POLICIES
DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access products" ON products;
CREATE POLICY "Admin full access products" ON products FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- 3d. COUPONS POLICIES
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access coupons" ON coupons;
CREATE POLICY "Admin full access coupons" ON coupons FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- 3e. DEALS POLICIES
DROP POLICY IF EXISTS "Public read deals" ON deals;
CREATE POLICY "Public read deals" ON deals FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin full access deals" ON deals;
CREATE POLICY "Admin full access deals" ON deals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- 3f. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
CREATE POLICY "Users can read their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================
-- 4. EMERGENCY ADMIN FIX (Run this if still locked out)
-- ============================================
-- Ensures all existing users are set to 'admin' role for testing.
-- Run this once in the SQL editor to unlock the admin panel.

UPDATE profiles SET role = 'admin' WHERE role IS NULL OR role = 'user';
