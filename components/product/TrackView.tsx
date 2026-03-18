'use client'

import { useEffect } from 'react'
import { trackProductView } from '@/components/home/RecentlyViewed'

interface TrackViewProps {
  id: string
  slug: string
  name: string
  image_url?: string
  price?: number
}

export function TrackView({ id, slug, name, image_url, price }: TrackViewProps) {
  useEffect(() => {
    trackProductView({ id, slug, name, image_url, price })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
