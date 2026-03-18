'use client'

import { useState } from 'react'

export function ExpandableTitle({ title }: { title: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = title.length > 80

  return (
    <h1 className="font-display text-xl md:text-2xl font-extrabold text-foreground leading-tight">
      {isLong && !expanded
        ? <>{title.slice(0, 80)}&hellip;&nbsp;<button type="button" onClick={() => setExpanded(true)} className="text-[13px] font-semibold text-primary hover:underline whitespace-nowrap">Show full title</button></>
        : title
      }
    </h1>
  )
}
