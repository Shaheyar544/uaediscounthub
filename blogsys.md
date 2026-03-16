Let me just write the complete prompt and implementation plan right here.

---

# UAEDiscountHub — Blog System Implementation Plan

## 📦 Dependencies to Install First

```bash
npm install sharp @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-table @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-typography @tailwindcss/typography dompurify @types/dompurify
```

---

## 🗄️ SECTION 1 — Database Schema (supabase/blog_schema.sql)

```sql
-- CATEGORIES
CREATE TABLE blog_categories (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  slug      text UNIQUE NOT NULL,
  color     text,
  icon      text,
  parent_id uuid REFERENCES blog_categories(id)
);

-- TAGS
CREATE TABLE blog_tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL
);

-- POSTS
CREATE TABLE blog_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  subtitle         text,
  slug             text UNIQUE NOT NULL,
  content          text NOT NULL,
  excerpt          text,
  featured_image   text,
  og_image         text,
  status           text DEFAULT 'draft' CHECK (status IN ('draft','published','scheduled','archived')),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  author_id        uuid REFERENCES auth.users(id),
  category_id      uuid REFERENCES blog_categories(id),
  reading_time_min int,
  view_count       int DEFAULT 0,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  canonical_url    text,
  schema_type      text DEFAULT 'Article',
  is_featured      boolean DEFAULT false,
  allow_comments   boolean DEFAULT true,
  locale           text DEFAULT 'en',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- POST TAGS JUNCTION
CREATE TABLE blog_post_tags (
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  uuid REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- IMAGE GALLERY
CREATE TABLE blog_post_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  url        text NOT NULL,
  alt_text   text,
  width      int,
  height     int,
  size_kb    int,
  sort_order int DEFAULT 0
);

-- AD WIDGETS
CREATE TABLE blog_ad_widgets (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  position  text NOT NULL, -- sidebar-top | sidebar-mid | sidebar-bottom | in-article
  html_code text,
  image_url text,
  link_url  text,
  title     text,
  cta_text  text,
  is_active boolean DEFAULT true,
  start_at  timestamptz,
  end_at    timestamptz
);

-- INDEXES
CREATE INDEX ON blog_posts(slug);
CREATE INDEX ON blog_posts(status);
CREATE INDEX ON blog_posts(category_id);
CREATE INDEX ON blog_posts(published_at DESC);
CREATE INDEX ON blog_posts(is_featured);

-- AUTO UPDATE updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins full access" ON blog_posts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 📁 SECTION 2 — File Structure to Create

```
app/
  [locale]/
    blog/
      page.tsx                    ← Blog listing page
      [slug]/
        page.tsx                  ← Single post page
    admin/
      blog/
        page.tsx                  ← Admin post list
        new/page.tsx              ← New post editor
        [id]/edit/page.tsx        ← Edit post editor
        ad-widgets/page.tsx       ← Ad widget manager

app/api/blog/
  posts/route.ts                  ← GET list, POST create
  posts/[id]/route.ts             ← GET, PUT, DELETE single
  posts/[id]/view/route.ts        ← Increment view count
  upload-image/route.ts           ← Sharp image processing
  ai-assist/route.ts              ← Anthropic AI writing help

components/blog/
  BlogCard.tsx
  ReadingProgressBar.tsx
  TableOfContents.tsx
  ShareBar.tsx
  AdWidget.tsx
  DealEmbed.tsx
  GoogleSearchPreview.tsx
  SEOChecklist.tsx

components/admin/blog/
  PostEditor.tsx

types/blog.ts
```

---

## 🖼️ SECTION 3 — Image Upload API (app/api/blog/upload-image/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Images only' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const id = crypto.randomUUID()
  const now = new Date()
  const path = `blog/${now.getFullYear()}/${now.getMonth() + 1}/${id}`

  // Original → WebP max 1200px
  const original = await sharp(buffer).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  // OG Image → 1200x630 cropped
  const og = await sharp(buffer).resize(1200, 630, { fit: 'cover' }).webp({ quality: 82 }).toBuffer()
  // Thumbnail → 400x300
  const thumb = await sharp(buffer).resize(400, 300, { fit: 'cover' }).webp({ quality: 75 }).toBuffer()

  const uploads = await Promise.all([
    supabase.storage.from('blog-images').upload(`${path}-original.webp`, original, { contentType: 'image/webp' }),
    supabase.storage.from('blog-images').upload(`${path}-og.webp`, og, { contentType: 'image/webp' }),
    supabase.storage.from('blog-images').upload(`${path}-thumb.webp`, thumb, { contentType: 'image/webp' }),
  ])

  const base = supabase.storage.from('blog-images').getPublicUrl('').data.publicUrl
  return NextResponse.json({
    original: `${base}${path}-original.webp`,
    og: `${base}${path}-og.webp`,
    thumb: `${base}${path}-thumb.webp`,
    size_kb: Math.round(original.length / 1024),
  })
}
```

---

## 📝 SECTION 4 — Types (types/blog.ts)

```typescript
export interface BlogPost {
  id: string
  title: string
  subtitle?: string
  slug: string
  content: string
  excerpt?: string
  featured_image?: string
  og_image?: string
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  scheduled_at?: string
  published_at?: string
  author_id: string
  author?: { full_name: string; avatar_url: string; role: string }
  category_id?: string
  category?: BlogCategory
  tags?: BlogTag[]
  images?: BlogPostImage[]
  reading_time_min: number
  view_count: number
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  canonical_url?: string
  schema_type: string
  is_featured: boolean
  allow_comments: boolean
  locale: string
  created_at: string
  updated_at: string
}

export interface BlogCategory {
  id: string; name: string; slug: string; color: string; icon: string
}
export interface BlogTag { id: string; name: string; slug: string }
export interface BlogPostImage {
  id: string; url: string; alt_text: string; width: number; height: number; size_kb: number
}
export interface BlogAdWidget {
  id: string; name: string; position: string; html_code?: string
  image_url?: string; link_url?: string; title?: string; cta_text?: string
  is_active: boolean
}
```

---

## 🌐 SECTION 5 — Blog Listing Page (app/[locale]/blog/page.tsx)

```typescript
import { createClient } from '@/utils/supabase/server'
import { BlogCard } from '@/components/blog/BlogCard'
import { AdWidget } from '@/components/blog/AdWidget'
import { BlogPost } from '@/types/blog'

export async function generateMetadata() {
  return {
    title: 'Blog — Shopping Guides & Deal Tips | UAEDiscountHub',
    description: 'Expert UAE shopping guides, deal breakdowns, coupon strategies and product reviews.',
    openGraph: { title: 'UAEDiscountHub Blog', type: 'website' }
  }
}

export const revalidate = 3600

export default async function BlogPage({ params, searchParams }: {
  params: { locale: string }
  searchParams: { category?: string; tag?: string; q?: string; page?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')
  const limit = 12

  let query = supabase
    .from('blog_posts')
    .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*), tags:blog_post_tags(tag:blog_tags(*))')
    .eq('status', 'published')
    .eq('locale', params.locale)
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (searchParams.category) query = query.eq('category.slug', searchParams.category)
  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`)

  const { data: posts } = await query
  const { data: categories } = await supabase.from('blog_categories').select('*')
  const { data: topAd } = await supabase.from('blog_ad_widgets').select('*').eq('position', 'sidebar-top').eq('is_active', true).single()
  const { data: midAd } = await supabase.from('blog_ad_widgets').select('*').eq('position', 'sidebar-mid').eq('is_active', true).single()

  const featured = posts?.find(p => p.is_featured) || posts?.[0]
  const rest = posts?.filter(p => p.id !== featured?.id) || []

  return (
    <main>
      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #0D1B3E 0%, #0057FF 60%, #0099FF 100%)', padding: '56px 32px 48px', color: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 40, marginBottom: 10 }}>Smart Shopping Starts Here</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>Expert tips, deal breakdowns and coupon strategies for UAE shoppers.</p>
          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`/${params.locale}/blog`} style={{ padding: '6px 16px', borderRadius: 20, background: searchParams.category ? 'rgba(255,255,255,0.12)' : 'white', color: searchParams.category ? 'white' : '#0057FF', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>All Posts</a>
            {categories?.map(cat => (
              <a key={cat.id} href={`/${params.locale}/blog?category=${cat.slug}`}
                style={{ padding: '6px 16px', borderRadius: 20, background: searchParams.category === cat.slug ? 'white' : 'rgba(255,255,255,0.12)', color: searchParams.category === cat.slug ? '#0057FF' : 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                {cat.icon} {cat.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        <div>
          {featured && <BlogCard post={featured} variant="featured" locale={params.locale} />}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
            {rest.map(post => <BlogCard key={post.id} post={post} variant="default" locale={params.locale} />)}
          </div>
        </div>
        {/* SIDEBAR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AdWidget ad={topAd} fallback="newsletter" />
          <AdWidget ad={midAd} fallback="coupons" />
        </aside>
      </div>
    </main>
  )
}
```

---

## 📖 SECTION 6 — Single Post Page (app/[locale]/blog/[slug]/page.tsx)

```typescript
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { ReadingProgressBar } from '@/components/blog/ReadingProgressBar'
import { TableOfContents } from '@/components/blog/TableOfContents'
import { ShareBar } from '@/components/blog/ShareBar'
import { AdWidget } from '@/components/blog/AdWidget'

export const revalidate = 1800

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }) {
  const supabase = createClient()
  const { data: post } = await supabase.from('blog_posts').select('*').eq('slug', params.slug).single()
  if (!post) return {}
  return {
    title: post.seo_title || `${post.title} | UAEDiscountHub`,
    description: post.seo_description || post.excerpt,
    keywords: post.seo_keywords?.join(', '),
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: [{ url: post.og_image || post.featured_image }],
      type: 'article',
      publishedTime: post.published_at,
    },
    twitter: { card: 'summary_large_image' },
    alternates: { canonical: post.canonical_url || `https://uaediscounthub.com/${params.locale}/blog/${params.slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string, locale: string } }) {
  const supabase = createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, author:author_id(full_name,avatar_url,role), category:category_id(*), tags:blog_post_tags(tag:blog_tags(*))')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  // Increment view count (fire and forget)
  supabase.rpc('increment_view_count', { post_id: post.id }).then(() => {})

  const { data: sidebarAd } = await supabase.from('blog_ad_widgets').select('*').eq('position', 'sidebar-top').eq('is_active', true).single()
  const { data: related } = await supabase.from('blog_posts').select('*, category:category_id(*)').eq('category_id', post.category_id).eq('status', 'published').neq('id', post.id).limit(3)

  // JSON-LD Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': post.schema_type || 'Article',
    headline: post.title,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author?.full_name },
    publisher: { '@type': 'Organization', name: 'UAEDiscountHub', url: 'https://uaediscounthub.com' },
    image: post.featured_image,
    description: post.excerpt,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ReadingProgressBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40 }}>
        <article>
          {/* Breadcrumb */}
          <nav style={{ fontSize: 12, color: '#8A94A6', marginBottom: 16 }}>
            <a href={`/${params.locale}`} style={{ color: '#0057FF', textDecoration: 'none' }}>Home</a> → <a href={`/${params.locale}/blog`} style={{ color: '#0057FF', textDecoration: 'none' }}>Blog</a> → {post.category?.name} → {post.title}
          </nav>

          {/* Title */}
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, lineHeight: 1.25, marginBottom: 16 }}>{post.title}</h1>

          {/* Info Bar */}
          <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderTop: '1px solid #DDE3EF', borderBottom: '1px solid #DDE3EF', marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{post.author?.full_name}</span>
            <span style={{ fontSize: 12, color: '#8A94A6' }}>📅 {new Date(post.published_at!).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span style={{ background: '#e8f0ff', color: '#0057FF', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⏱ {post.reading_time_min} min read</span>
            <span style={{ fontSize: 12, color: '#8A94A6' }}>👁 {post.view_count.toLocaleString()} views</span>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <img src={post.featured_image} alt={post.seo_title || post.title} style={{ width: '100%', borderRadius: 14, marginBottom: 32, aspectRatio: '16/9', objectFit: 'cover' }} loading="lazy" />
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

          <ShareBar url={`https://uaediscounthub.com/${params.locale}/blog/${post.slug}`} title={post.title} />

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '20px 0' }}>
            {post.tags?.map((t: any) => (
              <a key={t.tag.id} href={`/${params.locale}/blog?tag=${t.tag.slug}`} style={{ padding: '5px 12px', background: '#F0F3FA', borderRadius: 20, fontSize: 12, color: '#4B5675', fontWeight: 600, textDecoration: 'none' }}>#{t.tag.name}</a>
            ))}
          </div>

          {/* Author Box */}
          <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 24, display: 'flex', gap: 20, margin: '32px 0' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#0057FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
              {post.author?.full_name?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{post.author?.full_name}</div>
              <div style={{ fontSize: 12, color: '#FF6B00', fontWeight: 600, marginBottom: 8 }}>{post.author?.role}</div>
            </div>
          </div>

          {/* Related Posts */}
          {related && related.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Related Posts</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {related.map((r: any) => (
                  <a key={r.id} href={`/${params.locale}/blog/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit', background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, overflow: 'hidden', display: 'block' }}>
                    {r.featured_image && <img src={r.featured_image} alt={r.title} style={{ width: '100%', height: 120, objectFit: 'cover' }} />}
                    <div style={{ padding: 14, fontSize: 13, fontWeight: 600 }}>{r.title}</div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TableOfContents content={post.content} />
          <AdWidget ad={sidebarAd} fallback="newsletter" />
        </aside>
      </div>
    </>
  )
}
```

---

## ✏️ SECTION 7 — Admin Post Editor Key Logic (components/admin/blog/PostEditor.tsx)

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { BlogPost } from '@/types/blog'

// SEO Score Calculator
function calcSEOScore(post: Partial<BlogPost>, content: string): number {
  let score = 0
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  const titleLen = (post.seo_title || post.title || '').length
  const descLen = (post.seo_description || '').length
  const focusKw = post.seo_keywords?.[0]?.toLowerCase() || ''

  if (titleLen >= 50 && titleLen <= 60) score += 20
  if (descLen >= 140 && descLen <= 160) score += 20
  if (focusKw && post.title?.toLowerCase().includes(focusKw)) score += 15
  if (focusKw && content.toLowerCase().slice(0, 500).includes(focusKw)) score += 15
  if (post.featured_image) score += 10
  if ((post.slug || '').length <= 60) score += 10
  if (words >= 300) score += 10
  return score
}

// Reading time calculator
function calcReadingTime(content: string): number {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// Auto slug generator
function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60)
}

export function PostEditor({ initialPost }: { initialPost?: Partial<BlogPost> }) {
  const [post, setPost] = useState<Partial<BlogPost>>(initialPost || { status: 'draft', locale: 'en' })
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [seoScore, setSeoScore] = useState(0)
  const [readingTime, setReadingTime] = useState(1)
  const [wordCount, setWordCount] = useState(0)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit, Image, Link, Placeholder.configure({ placeholder: 'Start writing your post...' }), CharacterCount],
    content: initialPost?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      const words = text.split(/\s+/).filter(Boolean).length
      setWordCount(words)
      setReadingTime(calcReadingTime(html))
      setSeoScore(calcSEOScore(post, html))
      setPost(p => ({ ...p, content: html, reading_time_min: calcReadingTime(html) }))
    }
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      if (post.title && post.content) {
        setSaving(true)
        await fetch(`/api/blog/posts${post.id ? `/${post.id}` : ''}`, {
          method: post.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        })
        setLastSaved(new Date())
        setSaving(false)
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [post])

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/blog/upload-image', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    return data
  }

  // AI Assist
  const handleAIAssist = async (action: string, text: string) => {
    const res = await fetch('/api/blog/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text, title: post.title, keywords: post.seo_keywords })
    })
    const data = await res.json()
    return data.result
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: 24 }}>
      {/* LEFT: Main Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Autosave Status */}
        <div style={{ fontSize: 12, color: '#8A94A6' }}>
          {saving ? '💾 Saving...' : lastSaved ? `✅ Saved ${lastSaved.toLocaleTimeString()}` : '⚪ Not saved yet'}
        </div>

        {/* Title */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 24 }}>
          <textarea
            placeholder="Post Title — Make it compelling and keyword-rich..."
            value={post.title || ''}
            onChange={e => {
              const title = e.target.value
              setPost(p => ({ ...p, title, slug: p.slug || toSlug(title) }))
            }}
            style={{ width: '100%', border: 'none', outline: 'none', fontFamily: 'DM Serif Display, serif', fontSize: 30, resize: 'none', lineHeight: 1.3, background: 'transparent' }}
            rows={2}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #DDE3EF', fontSize: 12 }}>
            <span style={{ color: '#8A94A6' }}>🔗 uaediscounthub.com/blog/</span>
            <input
              value={post.slug || ''}
              onChange={e => setPost(p => ({ ...p, slug: e.target.value }))}
              style={{ flex: 1, border: '1.5px solid #DDE3EF', borderRadius: 6, padding: '4px 8px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
            />
            <button onClick={() => setPost(p => ({ ...p, slug: toSlug(p.title || '') }))}
              style={{ padding: '4px 10px', fontSize: 11, border: '1.5px solid #DDE3EF', borderRadius: 6, cursor: 'pointer' }}>
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#8A94A6', marginBottom: 10 }}>🖼 FEATURED IMAGE</div>
          {post.featured_image ? (
            <div>
              <img src={post.featured_image} alt="Featured" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />
              <button onClick={() => setPost(p => ({ ...p, featured_image: undefined }))} style={{ fontSize: 12, color: '#FF3B30', border: 'none', background: 'none', cursor: 'pointer' }}>Remove</button>
            </div>
          ) : (
            <label style={{ border: '2px dashed #DDE3EF', borderRadius: 14, padding: 30, textAlign: 'center', display: 'block', cursor: 'pointer' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{uploading ? 'Uploading...' : 'Drop image or click to upload'}</div>
              <div style={{ fontSize: 11, color: '#8A94A6', marginTop: 4 }}>Auto-converted to WebP · Compressed · OG image generated</div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                if (e.target.files?.[0]) {
                  const data = await handleImageUpload(e.target.files[0])
                  setPost(p => ({ ...p, featured_image: data.original, og_image: data.og }))
                }
              }} />
            </label>
          )}
        </div>

        {/* Tiptap Editor */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase', color: '#8A94A6', marginBottom: 12 }}>✍️ CONTENT</div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 2, padding: '8px 12px', background: '#F6F8FC', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['Bold','B',() => editor?.chain().focus().toggleBold().run()],
              ['Italic','I',() => editor?.chain().focus().toggleItalic().run()],
              ['H2','H2',() => editor?.chain().focus().toggleHeading({ level: 2 }).run()],
              ['H3','H3',() => editor?.chain().focus().toggleHeading({ level: 3 }).run()],
              ['Bullet List','≡',() => editor?.chain().focus().toggleBulletList().run()],
              ['Quote','"',() => editor?.chain().focus().toggleBlockquote().run()],
              ['Undo','↩',() => editor?.chain().focus().undo().run()],
              ['Redo','↪',() => editor?.chain().focus().redo().run()],
            ].map(([title, label, action]) => (
              <button key={label as string} title={title as string} onClick={action as () => void}
                style={{ padding: '5px 9px', border: 'none', background: 'none', borderRadius: 5, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#4B5675' }}>
                {label as string}
              </button>
            ))}
            <button onClick={() => handleAIAssist('improve', editor?.getHTML() || '').then(r => editor?.commands.setContent(r))}
              style={{ padding: '5px 12px', border: 'none', background: '#0057FF', color: 'white', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
              🤖 AI Assist
            </button>
          </div>
          <EditorContent editor={editor} style={{ minHeight: 350, fontSize: 15, lineHeight: 1.85, color: '#4B5675' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8A94A6', marginTop: 10, paddingTop: 10, borderTop: '1px solid #DDE3EF' }}>
            <span>Words: <strong>{wordCount}</strong> · ⏱ {readingTime} min read</span>
            <span>Characters: <strong>{editor?.storage.characterCount.characters() || 0}</strong></span>
          </div>
        </div>

      </div>

      {/* RIGHT: SEO Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Publish */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>🚀 Publish</div>
          {(['published', 'draft', 'scheduled'] as const).map(s => (
            <div key={s} onClick={() => setPost(p => ({ ...p, status: s }))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: `1.5px solid ${post.status === s ? '#0057FF' : '#DDE3EF'}`, background: post.status === s ? '#e8f0ff' : 'white', borderRadius: 8, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${post.status === s ? '#0057FF' : '#DDE3EF'}`, background: post.status === s ? '#0057FF' : 'white' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{s}</div>
              </div>
            </div>
          ))}
          <button
            onClick={async () => {
              await fetch(`/api/blog/posts${post.id ? `/${post.id}` : ''}`, {
                method: post.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...post, published_at: post.status === 'published' ? new Date().toISOString() : post.published_at })
              })
              alert('Saved!')
            }}
            style={{ width: '100%', padding: '10px', background: '#00C48C', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
            {post.status === 'published' ? '🚀 Publish Now' : '💾 Save Draft'}
          </button>
        </div>

        {/* SEO Score */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, marginBottom: 14 }}>
            🔍 SEO Score
            <span style={{ color: seoScore >= 70 ? '#00C48C' : seoScore >= 40 ? '#FFC107' : '#FF3B30', fontWeight: 800 }}>{seoScore}/100</span>
          </div>
          <div style={{ height: 6, background: '#DDE3EF', borderRadius: 3, marginBottom: 16 }}>
            <div style={{ height: '100%', width: `${seoScore}%`, background: seoScore >= 70 ? '#00C48C' : seoScore >= 40 ? '#FFC107' : '#FF3B30', borderRadius: 3, transition: 'width .3s' }} />
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#8A94A6', display: 'block', marginBottom: 4 }}>META TITLE</label>
          <input value={post.seo_title || ''} onChange={e => { setPost(p => ({ ...p, seo_title: e.target.value })); setSeoScore(calcSEOScore(post, editor?.getHTML() || '')) }}
            placeholder="Override meta title (50–60 chars)"
            style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${(post.seo_title?.length || 0) > 60 ? '#FF3B30' : '#DDE3EF'}`, borderRadius: 8, fontSize: 13, marginBottom: 4, boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: (post.seo_title?.length || 0) > 60 ? '#FF3B30' : '#8A94A6', textAlign: 'right', marginBottom: 10 }}>{post.seo_title?.length || 0}/60</div>

          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#8A94A6', display: 'block', marginBottom: 4 }}>META DESCRIPTION</label>
          <textarea value={post.seo_description || ''} onChange={e => { setPost(p => ({ ...p, seo_description: e.target.value })); setSeoScore(calcSEOScore(post, editor?.getHTML() || '')) }}
            placeholder="Meta description (140–160 chars)"
            style={{ width: '100%', padding: '8px 12px', border: `1.5px solid ${(post.seo_description?.length || 0) > 160 ? '#FF3B30' : '#DDE3EF'}`, borderRadius: 8, fontSize: 13, marginBottom: 4, minHeight: 70, resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: (post.seo_description?.length || 0) > 160 ? '#FF3B30' : '#8A94A6', textAlign: 'right', marginBottom: 10 }}>{post.seo_description?.length || 0}/160</div>

          {/* Google Preview */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: '#8A94A6', marginBottom: 8 }}>GOOGLE PREVIEW</div>
          <div style={{ background: 'white', borderRadius: 8, padding: 14, border: '1.5px solid #DDE3EF' }}>
            <div style={{ fontSize: 12, color: '#1a8917', marginBottom: 2 }}>uaediscounthub.com › blog › {post.slug || 'post-slug'}</div>
            <div style={{ fontSize: 17, color: '#1a0dab', marginBottom: 2, lineHeight: 1.3 }}>{(post.seo_title || post.title || 'Post Title').slice(0, 60)}{(post.seo_title || post.title || '').length > 60 ? '...' : ''}</div>
            <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.5 }}>{(post.seo_description || post.excerpt || 'Meta description will appear here...').slice(0, 160)}</div>
          </div>
        </div>

        {/* Keywords */}
        <div style={{ background: 'white', border: '1.5px solid #DDE3EF', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>🎯 Keywords</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input id="kw-input" placeholder="Add keyword..." style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #DDE3EF', borderRadius: 8, fontSize: 13 }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (document.getElementById('kw-input') as HTMLInputElement).value.trim()
                  if (val) { setPost(p => ({ ...p, seo_keywords: [...(p.seo_keywords || []), val] }));(document.getElementById('kw-input') as HTMLInputElement).value = '' }
                }
              }} />
            <button onClick={() => {
              const val = (document.getElementById('kw-input') as HTMLInputElement).value.trim()
              if (val) { setPost(p => ({ ...p, seo_keywords: [...(p.seo_keywords || []), val] }));(document.getElementById('kw-input') as HTMLInputElement).value = '' }
            }} style={{ padding: '7px 14px', background: '#0057FF', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {post.seo_keywords?.map((kw, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#e8f0ff', color: '#0057FF', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {kw}
                <span onClick={() => setPost(p => ({ ...p, seo_keywords: p.seo_keywords?.filter((_,j) => j !== i) }))} style={{ cursor: 'pointer', opacity: .6 }}>×</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
```

---

## 🧩 SECTION 8 — Supporting Components

**components/blog/ReadingProgressBar.tsx**
```typescript
'use client'
import { useEffect, useState } from 'react'
export function ReadingProgressBar() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const handler = () => {
      const el = document.documentElement
      setWidth((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100)
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return <div style={{ position: 'fixed', top: 0, left: 0, width: `${width}%`, height: 3, background: 'linear-gradient(90deg, #0057FF, #FF6B00)', zIndex: 9999, borderRadius: 2, transition: 'width .1s' }} />
}
```

**components/blog/ShareBar.tsx**
```typescript
'use client'
export function ShareBar({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', borderTop: '1px solid #DDE3EF', borderBottom: '1px solid #DDE3EF', margin: '32px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 700 }}>Share:</span>
      {[
        ['𝕏', `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`],
        ['in', `https://www.linkedin.com/shareArticle?url=${encoded}&title=${encodedTitle}`],
        ['f', `https://www.facebook.com/sharer/sharer.php?u=${encoded}`],
        ['📱', `https://wa.me/?text=${encodedTitle}%20${encoded}`],
      ].map(([icon, href]) => (
        <a key={icon} href={href} target="_blank" rel="noopener noreferrer"
          style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #DDE3EF', textDecoration: 'none', fontSize: 14, transition: 'all .15s' }}>
          {icon}
        </a>
      ))}
      <button onClick={() => navigator.clipboard.writeText(url).then(() => alert('Link copied!'))}
        style={{ marginLeft: 'auto', padding: '6px 14px', border: '1.5px solid #DDE3EF', borderRadius: 8, background: 'none', fontSize: 12, cursor: 'pointer' }}>
        🔗 Copy Link
      </button>
    </div>
  )
}
```

**components/blog/AdWidget.tsx**
```typescript
import { BlogAdWidget } from '@/types/blog'
export function AdWidget({ ad, fallback }: { ad?: BlogAdWidget | null; fallback?: string }) {
  if (!ad) {
    if (fallback === 'newsletter') return (
      <div style={{ background: 'linear-gradient(135deg,#0057FF,#0099FF)', borderRadius: 14, padding: 20, color: 'white' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📬 Get Deal Alerts</div>
        <input placeholder="your@email.com" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', marginBottom: 8, fontSize: 12, boxSizing: 'border-box' }} />
        <button style={{ width: '100%', padding: 9, background: 'white', color: '#0057FF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Subscribe Free</button>
      </div>
    )
    return null
  }
  if (ad.html_code) return <div dangerouslySetInnerHTML={{ __html: ad.html_code }} />
  return (
    <a href={ad.link_url || '#'} target="_blank" rel="noopener noreferrer sponsored" style={{ display: 'block', background: '#fff3eb', borderRadius: 14, padding: 20, textAlign: 'center', border: '1.5px dashed #ffb380', textDecoration: 'none' }}>
      <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#8A94A6', marginBottom: 8 }}>Advertisement</div>
      {ad.image_url && <img src={ad.image_url} alt={ad.title || 'Ad'} style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }} />}
      {ad.title && <div style={{ fontSize: 16, fontWeight: 800, color: '#FF6B00', marginBottom: 6 }}>{ad.title}</div>}
      {ad.cta_text && <div style={{ padding: '8px 16px', background: '#FF6B00', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'inline-block', marginTop: 8 }}>{ad.cta_text}</div>}
    </a>
  )
}
```

---

## 🤖 SECTION 9 — AI Assist API (app/api/blog/ai-assist/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const PROMPTS: Record<string, (text: string, title: string, keywords: string[]) => string> = {
  improve: (text) => `Improve this blog paragraph for a UAE shopping/deals website. Make it more engaging, clear and SEO-friendly. Keep the same meaning. Return only the improved HTML paragraph:\n\n${text}`,
  introduction: (_,title,kw) => `Write a compelling 2-paragraph introduction for a UAE shopping blog post titled "${title}". Target keywords: ${kw.join(', ')}. Write for UAE audience. Return as HTML paragraphs.`,
  faq: (_,title) => `Generate 5 FAQ questions and answers for a UAE shopping blog post titled "${title}". Return as HTML with <h3> for questions and <p> for answers.`,
  expand: (text) => `Expand this point with more detail and examples relevant to UAE shoppers. Return as HTML:\n\n${text}`,
  grammar: (text) => `Fix grammar and spelling in this text. Return only corrected HTML:\n\n${text}`,
  keywords: (_,title) => `Suggest 8 long-tail SEO keywords for a UAE shopping blog post titled "${title}". Return as JSON array of strings only.`,
}

export async function POST(req: NextRequest) {
  const { action, text, title, keywords } = await req.json()
  const promptFn = PROMPTS[action]
  if (!promptFn) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: promptFn(text || '', title || '', keywords || []) }]
  })

  const result = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ result })
}
```

---

## 📋 SECTION 10 — Sitemap Update (app/sitemap.ts)

```typescript
import { createClient } from '@/utils/supabase/server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, locale')
    .eq('status', 'published')

  const blogUrls = (posts || []).map(post => ({
    url: `https://uaediscounthub.com/${post.locale}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: 'https://uaediscounthub.com/en', lastModified: new Date(), priority: 1.0 },
    { url: 'https://uaediscounthub.com/en/blog', lastModified: new Date(), priority: 0.9 },
    { url: 'https://uaediscounthub.com/ar/blog', lastModified: new Date(), priority: 0.9 },
    ...blogUrls,
  ]
}
```

---

## ✅ Final Checklist — Implementation Order

1. Run the **SQL schema** in Supabase SQL editor
2. Create Supabase Storage bucket called `blog-images` (public)
3. Install all npm dependencies
4. Create `types/blog.ts`
5. Create all API routes
6. Create all components (BlogCard, AdWidget, ShareBar, ReadingProgressBar, TableOfContents)
7. Create `PostEditor.tsx`
8. Create frontend pages (`/blog` and `/blog/[slug]`)
9. Create admin pages (`/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit`)
10. Update `sitemap.ts`
11. Add `@tailwindcss/typography` to `tailwind.config.ts` plugins