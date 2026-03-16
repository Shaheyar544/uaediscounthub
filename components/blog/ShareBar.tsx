'use client'

import React from 'react'
import { Link2, Linkedin, Facebook, Send, Bookmark, Printer } from 'lucide-react'

interface ShareBarProps {
  url: string
  title: string
}

/**
 * ShareBar Component
 * Renders social sharing buttons and utility actions (Save, Print).
 * Matches the share-bar styling in UAEDiscountHub-Blog-System.html.
 */
export function ShareBar({ url, title }: ShareBarProps) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    { 
      name: 'X', 
      icon: <span className="font-bold">𝕏</span>, 
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` 
    },
    { 
      name: 'LinkedIn', 
      icon: <Linkedin size={14} />, 
      href: `https://www.linkedin.com/shareArticle?url=${encodedUrl}&title=${encodedTitle}` 
    },
    { 
      name: 'Facebook', 
      icon: <Facebook size={14} />, 
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` 
    },
    { 
      name: 'WhatsApp', 
      icon: <Send size={14} className="rotate-[-45deg]" />, 
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` 
    },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    // You could trigger a toast notification here if available
    alert('Link copied to clipboard!')
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-5 border-y border-[#DDE3EF] my-8">
      <span className="text-[12px] font-bold text-[#0D1117] mr-2">Share this guide:</span>
      
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-[#DDE3EF] text-[#0D1117] hover:bg-[#0057FF] hover:text-white hover:border-[#0057FF] transition-all cursor-pointer"
          title={`Share on ${link.name}`}
        >
          {link.icon}
        </a>
      ))}

      <button
        onClick={copyToClipboard}
        className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-[#DDE3EF] text-[#0D1117] hover:bg-[#0057FF] hover:text-white hover:border-[#0057FF] transition-all cursor-pointer"
        title="Copy link"
      >
        <Link2 size={16} />
      </button>

      <div className="ml-auto flex gap-2">
        <button className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-transparent text-[#0D1117] font-semibold text-[12px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all">
          <Bookmark size={14} /> 🔖 Save
        </button>
        <button 
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-[8px] border-[1.5px] border-[#DDE3EF] bg-transparent text-[#0D1117] font-semibold text-[12px] hover:border-[#0057FF] hover:text-[#0057FF] transition-all"
        >
          <Printer size={14} /> 𝖯𝗋𝗂𝗇𝗍
        </button>
      </div>
    </div>
  )
}
