import APISandboxClient from './APISandboxClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <APISandboxClient locale={locale} />
}
