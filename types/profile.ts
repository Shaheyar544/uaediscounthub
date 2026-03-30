export interface SocialLinks {
  twitter?: string
  linkedin?: string
  website?: string
}

export interface PublicAuthorProfile {
  id: string
  email: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  social_links: SocialLinks | null
  role: string | null
}
