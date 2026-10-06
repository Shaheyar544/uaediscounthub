"use client"

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Command, FileText, LoaderCircle, Plus, Search, X } from 'lucide-react'

type Result = { id: string; label: string; detail: string; type: string; href: string; status?: string }
type Group = { label: string; results: Result[] }

const createItems = [
  { label: 'New product', href: '/products/new' }, { label: 'New coupon', href: '/coupons/new' },
  { label: 'New blog post', href: '/blog/new' }, { label: 'New page', href: '/pages/new' },
]

export function AdminCommandCenter({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true) }
      if (event.key === 'Escape') { setOpen(false); setCreateOpen(false) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 0) }, [open])
  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) { setGroups([]); setLoading(false); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/global-search?q=${encodeURIComponent(normalized)}`, { signal: controller.signal })
        const payload = await response.json()
        if (response.ok) setGroups(payload.groups ?? [])
      } catch (error) { if ((error as Error).name !== 'AbortError') setGroups([]) } finally { if (!controller.signal.aborted) setLoading(false) }
    }, 180)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [query])

  const hasResults = useMemo(() => groups.some((group) => group.results.length > 0), [groups])
  return <div className="flex items-center gap-2">
    <button type="button" onClick={() => setOpen(true)} className="hidden h-10 w-72 items-center gap-2 rounded-xl border bg-card px-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:flex" aria-label="Search admin records"><Search className="size-4" aria-hidden="true" /><span className="flex-1">Search products, deals, stores…</span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd></button>
    <button type="button" onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden" aria-label="Search admin records"><Search className="size-4" /></button>
    <div className="relative"><button type="button" onClick={() => setCreateOpen((value) => !value)} aria-expanded={createOpen} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Plus className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Create</span></button>
      {createOpen && <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-xl"><p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Quick create</p>{createItems.map((item) => <Link key={item.href} href={`/${locale}/admin${item.href}`} onClick={() => setCreateOpen(false)} className="flex min-h-10 items-center rounded-lg px-2.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{item.label}</Link>)}</div>}
    </div>
    {open && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/50 p-4 pt-[10vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Global admin search"><button type="button" className="absolute inset-0" aria-label="Close search" onClick={() => setOpen(false)} /><div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl"><div className="flex items-center gap-3 border-b px-4"><Search className="size-5 text-muted-foreground" aria-hidden="true" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, deals, stores, coupons…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close search"><X className="size-4" /></button></div><div className="max-h-[60vh] overflow-y-auto p-2">{loading ? <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Searching records…</div> : query.trim().length < 2 ? <div className="p-6 text-center text-sm text-muted-foreground"><Command className="mx-auto mb-2 size-5" aria-hidden="true" />Search across catalog, deals, coupons, stores, content, and users.</div> : hasResults ? groups.map((group) => <div key={group.label} className="py-1"><p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</p>{group.results.map((result) => <Link key={`${result.type}-${result.id}`} href={`/${locale}/admin${result.href}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-8 place-items-center rounded-lg bg-muted text-muted-foreground"><FileText className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{result.label}</span><span className="block truncate text-xs text-muted-foreground">{result.detail}</span></span><span className="text-xs font-medium text-muted-foreground">{result.status ?? result.type}</span></Link>)}</div>) : <div className="p-6 text-center text-sm text-muted-foreground">No matching admin records. Try a different search term.</div>}</div></div></div>}
  </div>
}
