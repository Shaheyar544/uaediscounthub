import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Params {
  locale: string
  slug: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const supabase = createAdminClient()

  const { data: page } = await supabase
    .from('pages')
    .select('title_en, title_ar, meta_title, meta_description, canonical_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!page) return {}

  const title = page.meta_title || (locale === 'ar' ? page.title_ar : page.title_en)
  const description = page.meta_description || undefined

  return {
    title,
    description,
    ...(page.canonical_url && {
      alternates: { canonical: page.canonical_url },
    }),
  }
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale, slug } = await params
  const supabase = createAdminClient()

  const { data: page } = await supabase
    .from('pages')
    .select('title_en, title_ar, content_en, content_ar, status')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!page || page.status !== 'published') notFound()

  const title = locale === 'ar' ? (page.title_ar || page.title_en) : page.title_en
  const content = locale === 'ar' ? (page.content_ar || page.content_en) : page.content_en

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
      <h1 className="text-[32px] font-black text-[#0D1117] mb-8 leading-tight">
        {title}
      </h1>
      <div
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className="prose prose-lg max-w-none text-[#4B5675]
          [&>h1]:text-[26px] [&>h1]:font-extrabold [&>h1]:text-[#0D1117] [&>h1]:mt-10 [&>h1]:mb-4
          [&>h2]:text-[20px] [&>h2]:font-extrabold [&>h2]:text-[#0D1117] [&>h2]:mt-8 [&>h2]:mb-3
          [&>h3]:text-[16px] [&>h3]:font-bold [&>h3]:text-[#0D1117] [&>h3]:mt-6 [&>h3]:mb-2
          [&>p]:text-[15px] [&>p]:leading-relaxed [&>p]:mb-4
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1.5 [&>ul>li]:text-[15px]
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol>li]:mb-1.5 [&>ol>li]:text-[15px]
          [&>strong]:text-[#0D1117] [&>strong]:font-bold
          [&_a]:text-[#0057FF] [&_a]:underline [&_a:hover]:text-[#0047dd]"
        dangerouslySetInnerHTML={{ __html: content || '' }}
      />
    </div>
  )
}
