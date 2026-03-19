import { MetadataRoute } from 'next'
import { createAdminClient } from '@/utils/supabase/admin'

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('site_settings')
      .select('primary_domain')
      .eq('id', 'global')
      .single()

    const domain = data?.primary_domain || 'https://uaediscounthub.com'

    return {
      rules: [
        { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
        { userAgent: 'GPTBot', disallow: ['/'] },
        { userAgent: 'CCBot', disallow: ['/'] },
      ],
      sitemap: `${domain}/sitemap.xml`,
    }
  } catch {
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      sitemap: 'https://uaediscounthub.com/sitemap.xml',
    }
  }
}
