'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = code
      el.style.position = 'fixed'
      el.style.opacity  = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all shrink-0 ${
        copied
          ? 'bg-[#E8F8F0] text-[#00C48C] border border-[#00C48C]/30'
          : 'bg-[#0057FF] text-white hover:bg-[#0047DD] active:scale-95'
      }`}
    >
      {copied
        ? <><Check size={13} /> Copied!</>
        : <><Copy size={13} /> Copy</>
      }
    </button>
  )
}
