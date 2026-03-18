'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonProps {
  title: string
  price: number
}

export function ShareButton({ title, price }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Check out ${title} at AED ${price.toLocaleString()} on UAEDiscountHub`,
          url,
        })
      } catch {
        // User cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Link copied!' : 'Share'}
      className="w-10 h-10 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-all relative"
    >
      <Share2 className="w-4 h-4" />
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-gray-900 text-white px-2 py-0.5 rounded whitespace-nowrap">
          Copied!
        </span>
      )}
    </button>
  )
}
