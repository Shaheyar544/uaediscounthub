import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ProfileClient } from './ProfileClient'
import type { SocialLinks } from '@/types/profile'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  // Fetch full auth user details (last_sign_in_at, created_at) via admin client
  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(user.id)

  // Fetch profile for role field
  const { data: profile } = await admin
    .from('profiles')
    .select('role, display_name, bio, avatar_url, social_links')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient
      email={user.email ?? ''}
      userId={user.id}
      role={profile?.role ?? 'admin'}
      displayName={profile?.display_name ?? ''}
      bio={profile?.bio ?? ''}
      avatarUrl={profile?.avatar_url ?? ''}
      socialLinks={(profile?.social_links as SocialLinks | null) ?? {}}
      lastSignIn={authUser?.user?.last_sign_in_at ?? null}
      createdAt={authUser?.user?.created_at ?? user.created_at ?? ''}
      locale={locale}
    />
  )
}
