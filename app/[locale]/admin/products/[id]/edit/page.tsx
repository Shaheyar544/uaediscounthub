import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ProductForm } from '@/components/admin/products/ProductForm'
import type { ProductFormInitialData } from '@/components/admin/products/ProductForm'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: product }, { data: categories }, { data: stores }, { data: storePrices }] =
    await Promise.all([
      adminClient.from('products').select('*').eq('id', id).single(),
      supabase.from('categories').select('id, name_en').order('name_en'),
      adminClient.from('stores').select('id, name, logo_url').eq('is_active', true).order('name'),
      adminClient.from('product_store_prices').select('*').eq('product_id', id),
    ])

  if (!product) notFound()

  // Normalize specs: DB stores as JSONB object → Record<string, string>
  const specsObj = (product.specifications ?? {}) as Record<string, string>

  // Normalize store prices to match StorePriceRow (allows number | '')
  const mappedStorePrices = (storePrices ?? []).map((sp) => ({
    id: sp.id as string,
    store_id: sp.store_id as string,
    price: sp.price as number,
    original_price: (sp.original_price ?? '') as number | '',
    affiliate_url: (sp.affiliate_url ?? '') as string,
    coupon_code: (sp.coupon_code ?? '') as string,
    coupon_discount: (sp.coupon_discount ?? '') as string,
    in_stock: (sp.in_stock ?? true) as boolean,
    is_best_price: (sp.is_best_price ?? false) as boolean,
  }))

  const initialData: ProductFormInitialData = {
    id: product.id,
    name_en: product.name_en ?? product.name ?? '',
    name_ar: product.name_ar ?? '',
    slug: product.slug ?? '',
    brand: product.brand ?? '',
    model: product.model ?? '',
    sku: product.sku ?? '',
    category_id: product.category_id ?? '',
    status: (product.status ?? 'draft') as 'draft' | 'published' | 'archived',
    tags: product.tags ?? [],
    image_url: product.image_url ?? product.thumbnail_url ?? '',
    additional_images: (product.images ?? []) as string[],
    description_en: product.description_en ?? product.description ?? '',
    description_ar: product.description_ar ?? '',
    specifications: specsObj,
    meta_title: product.meta_title ?? product.seo_title_en ?? '',
    meta_description: product.meta_description ?? product.seo_description_en ?? '',
    is_featured: product.is_featured ?? false,
    is_trending: product.is_trending ?? false,
    store_prices: mappedStorePrices,
  }

  return (
    <ProductForm
      locale={locale}
      categories={categories ?? []}
      stores={stores ?? []}
      initialData={initialData}
    />
  )
}
