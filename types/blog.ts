import type { SocialLinks } from '@/types/profile'

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
  author?: {
    display_name: string | null
    bio?: string | null
    avatar_url: string | null
    role: string | null
    social_links?: SocialLinks | null
  }
  category_id?: string
  category?: BlogCategory
  tags?: { tag: BlogTag }[]
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
  id: string
  name: string
  slug: string
  color: string
  icon: string
  parent_id?: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
}

export interface BlogPostImage {
  id: string
  post_id: string
  url: string
  alt_text?: string
  width?: number
  height?: number
  size_kb?: number
  sort_order: number
}

export interface BlogAdWidget {
  id: string
  name: string
  position: 'sidebar-top' | 'sidebar-mid' | 'sidebar-bottom' | 'in-article'
  html_code?: string
  image_url?: string
  link_url?: string
  title?: string
  cta_text?: string
  is_active: boolean
  start_at?: string
  end_at?: string
}
