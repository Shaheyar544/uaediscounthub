import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ProductForm } from '@/components/admin/products/ProductForm'

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: categories }, { data: stores }] = await Promise.all([
    supabase.from('categories').select('id, name_en').order('name_en'),
    adminClient.from('stores').select('id, name, logo_url').eq('is_active', true).order('name'),
  ])

  return (
    <ProductForm
      locale={locale}
      categories={categories ?? []}
      stores={stores ?? []}
    />
  )
}
