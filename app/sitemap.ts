import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()
    
    // Fetch base URL from site_settings dynamically
    let baseUrl = 'https://uaediscounthub.com'
    try {
        const { data: settings } = await supabase
            .from('site_settings')
            .select('primary_domain')
            .eq('id', 'global')
            .single()
        if (settings?.primary_domain) {
            baseUrl = settings.primary_domain.replace(/\/$/, '')
        }
    } catch (e) {
        console.error('❌ Failed to fetch primary_domain from site_settings:', e)
    }

    // Fetch all active products
    const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('is_active', true)

    // Fetch all active categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')
        .eq('is_active', true)

    // Fetch all active custom CMS pages
    const { data: pages } = await supabase
        .from('pages')
        .select('slug, updated_at')
        .eq('is_active', true)
        .eq('status', 'published')

    // Fetch all active blog posts
    const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, locale, canonical_url')
        .eq('status', 'published')

    const productEntries: MetadataRoute.Sitemap = (products || []).flatMap((product) => {
        const enUrl = `${baseUrl}/en/product/${product.slug}`
        const arUrl = `${baseUrl}/ar/product/${product.slug}`
        const lastMod = product.updated_at ? new Date(product.updated_at) : new Date()

        return [
            {
                url: enUrl,
                lastModified: lastMod,
                changeFrequency: 'daily',
                priority: 0.8,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
            {
                url: arUrl,
                lastModified: lastMod,
                changeFrequency: 'daily',
                priority: 0.8,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
        ]
    })

    const categoryEntries: MetadataRoute.Sitemap = (categories || []).flatMap((category) => {
        const enUrl = `${baseUrl}/en/category/${category.slug}`
        const arUrl = `${baseUrl}/ar/category/${category.slug}`

        return [
            {
                url: enUrl,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
            {
                url: arUrl,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.6,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
        ]
    })

    const pageEntries: MetadataRoute.Sitemap = (pages || []).flatMap((page) => {
        const enUrl = `${baseUrl}/en/${page.slug}`
        const arUrl = `${baseUrl}/ar/${page.slug}`
        const lastMod = page.updated_at ? new Date(page.updated_at) : new Date()

        return [
            {
                url: enUrl,
                lastModified: lastMod,
                changeFrequency: 'weekly',
                priority: 0.7,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
            {
                url: arUrl,
                lastModified: lastMod,
                changeFrequency: 'weekly',
                priority: 0.7,
                alternates: {
                    languages: {
                        en: enUrl,
                        ar: arUrl,
                    },
                },
            },
        ]
    })

    const blogEntries: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
        url: post.canonical_url || `${baseUrl}/${post.locale}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...(['en', 'ar'] as const).flatMap((lang) => {
            const homeUrl = `${baseUrl}/${lang}`
            const dealsUrl = `${baseUrl}/${lang}/deals`
            const couponsUrl = `${baseUrl}/${lang}/coupons`
            const blogUrl = `${baseUrl}/${lang}/blog`

            return [
                {
                    url: homeUrl,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 1,
                    alternates: {
                        languages: {
                            en: `${baseUrl}/en`,
                            ar: `${baseUrl}/ar`,
                        },
                    },
                },
                {
                    url: dealsUrl,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.9,
                    alternates: {
                        languages: {
                            en: `${baseUrl}/en/deals`,
                            ar: `${baseUrl}/ar/deals`,
                        },
                    },
                },
                {
                    url: couponsUrl,
                    lastModified: new Date(),
                    changeFrequency: 'daily',
                    priority: 0.9,
                    alternates: {
                        languages: {
                            en: `${baseUrl}/en/coupons`,
                            ar: `${baseUrl}/ar/coupons`,
                        },
                    },
                },
                {
                    url: blogUrl,
                    lastModified: new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.9,
                    alternates: {
                        languages: {
                            en: `${baseUrl}/en/blog`,
                            ar: `${baseUrl}/ar/blog`,
                        },
                    },
                },
            ]
        }),
    ]

    return [...staticEntries, ...productEntries, ...categoryEntries, ...pageEntries, ...blogEntries]
}
