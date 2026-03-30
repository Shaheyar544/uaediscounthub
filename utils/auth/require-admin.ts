import 'server-only'

import { createClient } from '@/utils/supabase/server'
import { AdminAuthError, hasAdminRole } from '@/utils/auth/admin'

export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AdminAuthError('Unauthorized', 401)
  }

  if (!hasAdminRole(user)) {
    throw new AdminAuthError('Forbidden', 403)
  }

  return { supabase, user }
}
