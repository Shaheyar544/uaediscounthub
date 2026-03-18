'use client'

import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home',    href: '/en' },
  { icon: '🔥', label: 'Deals',   href: '/en/deals' },
  { icon: '🏷️', label: 'Coupons', href: '/en/coupons' },
  { icon: '📊', label: 'Compare', href: '/en/compare' },
  { icon: '👤', label: 'Account', href: '/en/login' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-2xl">
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/en' && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : ''}`}>
                {item.label}
              </span>
              {isActive && <span className="absolute bottom-0 w-6 h-0.5 bg-blue-600 rounded-full" />}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
