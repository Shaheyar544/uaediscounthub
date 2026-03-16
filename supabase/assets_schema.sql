-- ============================================
-- ASSETS / MEDIA MANAGEMENT (R2 SYNC)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  public_url TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  bucket_name TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE, -- The R2 path/key
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming 'admin' role from profiles or auth logic)
-- For now, allowing authenticated users to read, and service-role/admin logic to write
CREATE POLICY "Allow public read access to assets"
  ON public.assets FOR SELECT
  USING (true);

CREATE POLICY "Allow admin to manage assets"
  ON public.assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_mime_type ON public.assets(mime_type);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);
