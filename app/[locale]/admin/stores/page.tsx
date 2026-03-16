import StoresClient from './StoresClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <StoresClient locale={locale} />
}
