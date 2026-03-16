import BlogClient from './BlogClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <BlogClient locale={locale} />
}
