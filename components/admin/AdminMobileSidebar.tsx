"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { AdminNavigation } from './AdminSidebar'

export function AdminMobileSidebar({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [])
  return <div className="lg:hidden">
    <button type="button" onClick={() => setOpen(true)} aria-label="Open admin navigation" className="grid size-10 place-items-center rounded-xl border bg-background text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"><Menu className="size-5" aria-hidden="true" /></button>
    {open && <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Admin navigation">
      <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 start-0 flex h-dvh w-[min(18rem,calc(100vw-3rem))] flex-col bg-[#0b1220] shadow-2xl">
        <div className="flex h-[68px] items-center justify-between border-b border-slate-800 px-5"><Link href={`/${locale}/admin`} onClick={() => setOpen(false)} className="text-sm font-extrabold text-white">UAE Discount Hub</Link><button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="grid size-10 place-items-center rounded-xl text-slate-300 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-400"><X className="size-5" /></button></div>
        <div className="flex-1 overflow-y-auto px-3 py-5"><AdminNavigation locale={locale} onNavigate={() => setOpen(false)} /></div>
      </aside>
    </div>}
  </div>
}
