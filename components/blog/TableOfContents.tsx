'use client'

import React, { useEffect, useState } from 'react'

interface TOCItem {
  id: string
  text: string
  level: number
}

/**
 * TableOfContents Component
 * Automatically extracts headings from the blog content and provides a navigation menu.
 * Highlights the current active section as the user scrolls.
 */
export function TableOfContents({ content }: { content: string }) {
  const [items, setItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from content using regex or by querying the DOM after render
    // Since content is a string, we'll parse it after it's rendered in the post page
    // For now, we'll use a standard approach of querying the DOM
    const extractHeadings = () => {
      const headings = Array.from(document.querySelectorAll('.prose h2, .prose h3'))
      const tocItems: TOCItem[] = headings.map((heading) => {
        // Ensure headings have IDs for linking
        if (!heading.id) {
          heading.id = heading.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || crypto.randomUUID()
        }
        return {
          id: heading.id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.substring(1)),
        }
      })
      setItems(tocItems)
    }

    // Set a small timeout to ensure the DOM is ready
    const timer = setTimeout(extractHeadings, 100)

    // IntersectionObserver to highlight active section
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id)
        }
      },
      { rootMargin: '-10% 0px -70% 0px' }
    )

    document.querySelectorAll('.prose h2, .prose h3').forEach((h) => observer.observe(h))

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [content])

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-[14px] border-[1.5px] border-[#DDE3EF] p-5 sticky top-32">
      <div className="flex items-center gap-2 text-[14px] font-extrabold mb-4 border-l-4 border-[#0057FF] pl-3">
        📋 Table of Contents
      </div>
      <ul className="space-y-0">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-[#DDE3EF] last:border-none">
            <a
              href={`#${item.id}`}
              className={`flex items-center gap-2 py-2.5 text-[12px] transition-colors hover:text-[#0057FF] ${
                activeId === item.id ? 'text-[#0057FF] font-bold' : 'text-[#4B5675]'
              } ${item.level === 3 ? 'pl-6' : ''}`}
            >
              <span className="font-mono text-[10px] text-[#8A94A6] min-w-[18px]">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
