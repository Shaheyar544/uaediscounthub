import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()
    const baseUrl = 'https://uaediscounthub.com'

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

    // Fetch all active blog posts
    const { data: blogPosts } = await supabase
        .from('blog_posts')
        .select('slug, updated_at, locale')
        .eq('status', 'published')

    const productEntries: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${baseUrl}/en/product/${product.slug}`,
        lastModified: product.updated_at,
        changeFrequency: 'daily',
        priority: 0.8,
    }))

    const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((category) => ({
        url: `${baseUrl}/en/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
    }))

    const blogEntries: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
        url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
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
        {
            url: `${baseUrl}/en`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/en/deals`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/en/coupons`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/en/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/ar/blog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ]

    return [...staticEntries, ...productEntries, ...categoryEntries, ...blogEntries]
}
