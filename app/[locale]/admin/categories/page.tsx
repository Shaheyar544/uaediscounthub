import CategoriesClient from './CategoriesClient'

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <CategoriesClient locale={locale} />
}
