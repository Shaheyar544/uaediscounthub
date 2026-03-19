import { createAdminClient } from '@/utils/supabase/admin'
import SettingsClient from './SettingsClient'
import type { SiteSettings } from './SettingsClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const admin = createAdminClient()

  const { data } = await admin
    .from('site_settings')
    .select('*')
    .eq('id', 'global')
    .single()

  return <SettingsClient locale={locale} initialSettings={data as SiteSettings | null} />
}
