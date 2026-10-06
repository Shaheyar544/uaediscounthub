"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Activity, Beaker, ChevronDown, FileCode, FileText, FolderTree, LayoutDashboard, LayoutPanelTop, Mail, PenTool, Settings, ShoppingBag, Store, Tags, UserCircle, Users, Zap } from 'lucide-react'

export const adminNavGroups = [
  { label: 'Workspace', items: [
    { href: '', label: 'Overview', icon: LayoutDashboard }, { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/deals', label: 'Deals', icon: Zap }, { href: '/coupons', label: 'Coupons', icon: Tags },
    { href: '/stores', label: 'Stores', icon: Store }, { href: '/categories', label: 'Categories', icon: FolderTree },
    { href: '/newsletters', label: 'Newsletter', icon: Mail }, { href: '/users', label: 'Users', icon: Users },
  ] },
  { label: 'Content', items: [
    { href: '/pages', label: 'Pages', icon: FileCode }, { href: '/blog', label: 'Blog Posts', icon: FileText },
    { href: '/blog/new', label: 'Write New Post', icon: PenTool }, { href: '/blog/ad-widgets', label: 'Ad Widgets', icon: LayoutPanelTop },
  ] },
  { label: 'System', items: [
    { href: '/settings', label: 'Settings', icon: Settings }, { href: '/api-sandbox', label: 'API Sandbox', icon: Beaker },
    { href: '/profile', label: 'My Profile', icon: UserCircle },
  ] },
]

export function AdminNavigation({ locale, onNavigate }: { locale: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try { setCollapsed(JSON.parse(window.localStorage.getItem('udh-admin-nav-collapsed') ?? '{}')) } catch { setCollapsed({}) }
  }, [])
  const toggleGroup = (label: string) => setCollapsed((current) => {
    const next = { ...current, [label]: !current[label] }
    window.localStorage.setItem('udh-admin-nav-collapsed', JSON.stringify(next))
    return next
  })
  return <nav aria-label="Admin navigation" className="space-y-7">
    {adminNavGroups.map((group) => <div key={group.label}>
      <button type="button" onClick={() => toggleGroup(group.label)} aria-expanded={!collapsed[group.label]} className="mb-2 flex min-h-8 w-full items-center justify-between rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><span>{group.label}</span><ChevronDown className={`size-3.5 transition-transform motion-reduce:transition-none ${collapsed[group.label] ? '-rotate-90' : ''}`} aria-hidden="true" /></button>
      {!collapsed[group.label] && <div className="space-y-1">{group.items.map((item) => {
        const href = `/${locale}/admin${item.href}`
        const active = pathname === href || (item.href !== '' && pathname.startsWith(href))
        const Icon = item.icon
        return <Link key={item.href} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
          className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}>
          <Icon className="size-4 shrink-0" aria-hidden="true" /><span>{item.label}</span>
        </Link>
      })}</div>}
    </div>)}
  </nav>
}

export function AdminSidebar({ locale }: { locale: string }) {
  return <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-slate-800 bg-[#0b1220] lg:flex">
    <div className="flex h-[68px] items-center gap-3 border-b border-slate-800 px-5">
      <div className="grid size-8 place-items-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-950/40" aria-hidden="true">U</div>
      <div className="min-w-0"><Link href={`/${locale}/admin`} className="block truncate text-sm font-extrabold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">UAE Discount Hub</Link><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">Operations center</p></div>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-5"><AdminNavigation locale={locale} /></div>
    <div className="border-t border-slate-800 p-4 text-xs text-slate-400"><div className="flex items-center gap-2"><Activity className="size-3.5 text-emerald-400" aria-hidden="true" />System online</div></div>
  </aside>
}
