import SettingsClient from './SettingsClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <SettingsClient locale={locale} />
}
