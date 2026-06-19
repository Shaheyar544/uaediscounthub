import type { User } from '@supabase/supabase-js'

export class AdminAuthError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}

export function hasAdminRole(user: Pick<User, 'app_metadata'> | null | undefined) {
  return user?.app_metadata?.role === 'admin'
}
