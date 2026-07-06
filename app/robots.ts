import { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

interface RawRule {
  userAgent: string
  allow: string[]
  disallow: string[]
}

function parseRobotsTxt(content: string, defaultDomain: string): MetadataRoute.Robots {
  const lines = content.split(/\r?\n/)
  const rules: RawRule[] = []
  let currentRule: RawRule | null = null
  let sitemapUrl = `${defaultDomain}/sitemap.xml`

  for (let line of lines) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.substring(0, colonIndex).trim().toLowerCase()
    const value = line.substring(colonIndex + 1).trim()

    if (key === 'user-agent') {
      if (currentRule && (currentRule.allow.length > 0 || currentRule.disallow.length > 0)) {
        rules.push(currentRule)
      }
      currentRule = { userAgent: value, allow: [], disallow: [] }
    } else if (key === 'allow') {
      if (!currentRule) {
        currentRule = { userAgent: '*', allow: [], disallow: [] }
      }
      currentRule.allow.push(value)
    } else if (key === 'disallow') {
      if (!currentRule) {
        currentRule = { userAgent: '*', allow: [], disallow: [] }
      }
      currentRule.disallow.push(value)
    } else if (key === 'sitemap') {
      sitemapUrl = value
    }
  }

  if (currentRule && (currentRule.allow.length > 0 || currentRule.disallow.length > 0)) {
    rules.push(currentRule)
  }

  if (rules.length === 0) {
    return {
      rules: [
        { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
        { userAgent: 'GPTBot', disallow: ['/'] },
        { userAgent: 'CCBot', disallow: ['/'] },
      ],
      sitemap: sitemapUrl,
    }
  }

  return {
    rules: rules.map(r => ({
      userAgent: r.userAgent,
      allow: r.allow.length > 0 ? r.allow : undefined,
      disallow: r.disallow.length > 0 ? r.disallow : undefined,
    })),
    sitemap: sitemapUrl,
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const defaultDomain = 'https://uaediscounthub.com'
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('primary_domain, robots_txt')
      .eq('id', 'global')
      .single()

    const domain = data?.primary_domain || defaultDomain
    const robotsTxt = data?.robots_txt

    if (robotsTxt) {
      return parseRobotsTxt(robotsTxt, domain)
    }

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
      sitemap: `${defaultDomain}/sitemap.xml`,
    }
  }
}
