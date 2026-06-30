'use client'

import { usePathname } from 'next/navigation'

export function MobileBottomNav() {
  const pathname = usePathname()

  // Extract locale (e.g., "en" or "ar") from pathname /en/... or /ar/...
  const segments = pathname.split('/')
  const locale = (segments[1] === 'ar' || segments[1] === 'en') ? segments[1] : 'en'

  const navItems = [
    { icon: '🏠', label: locale === 'ar' ? 'الرئيسية' : 'Home',    href: `/${locale}` },
    { icon: '🔥', label: locale === 'ar' ? 'العروض' : 'Deals',   href: `/${locale}/deals` },
    { icon: '🏷️', label: locale === 'ar' ? 'الكوبونات' : 'Coupons', href: `/${locale}/coupons` },
    { icon: '📊', label: locale === 'ar' ? 'المقارنة' : 'Compare', href: `/${locale}/compare` },
    { icon: '👤', label: locale === 'ar' ? 'الحساب' : 'Account', href: `/${locale}/login` },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 shadow-2xl">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href))
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
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
