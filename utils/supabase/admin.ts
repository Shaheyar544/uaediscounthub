import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * USES SERVICE_ROLE_KEY: Bypass RLS for server-side management tasks.
 * NEVER use this on the client side.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Admin Environment Variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
