import Link from 'next/link'
import { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { Search, Bell, Moon, Sun, Monitor } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/utils/supabase/server'

export async function Navbar({ locale }: { locale: Locale }) {
    const dict = await getDictionary(locale);
    const supabase = await createClient();

    const { data: headerPages } = await supabase
        .from('pages')
        .select('slug, title_en, title_ar')
        .eq('placement', 'header')
        .eq('is_visible', true)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

    return (
        <nav className="navbar sticky top-0 z-[100] bg-white/92 backdrop-blur-[16px] border-b border-border h-[60px] flex items-center">
            <div className="navbar-inner max-w-[1280px] w-full mx-auto px-6 flex items-center gap-6">
                <Link href={`/${locale}`} className="logo font-display font-extrabold text-[18px] tracking-tight text-foreground whitespace-nowrap flex items-center gap-2">
                    <div className="logo-dot w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    UAEDiscountHub
                </Link>

                <ul className="nav-links hidden lg:flex items-center gap-1 list-none">
                    <li>
                        <Link href={`/${locale}`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.home}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/deals`} className="text-[13.5px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-3 py-1.5 rounded-sm hover:bg-[#FF6B00]/18 transition-all">
                            🔥 {dict.common.deals}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/coupons`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.coupons}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/compare`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            {dict.common.compare}
                        </Link>
                    </li>
                    <li>
                        <Link href={`/${locale}/blog`} className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all">
                            Blog
                        </Link>
                    </li>
                    {headerPages?.map((page) => (
                        <li key={page.slug}>
                            <Link 
                                href={`/${locale}/${page.slug}`} 
                                className="text-[13.5px] font-medium text-muted-foreground px-3 py-1.5 rounded-sm hover:bg-secondary hover:text-foreground transition-all"
                            >
                                {locale === 'ar' ? page.title_ar || page.title_en : page.title_en}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="nav-search flex-1 max-w-[340px] relative">
                    <Search className="nav-search-icon absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search Products & Deals..."
                        suppressHydrationWarning
                        className="w-full h-9.5 border-1.5 border-border rounded-full pl-9.5 pr-3.5 font-body text-[13.5px] bg-secondary text-foreground outline-none transition-all focus:border-primary focus:bg-white focus:ring-3 focus:ring-primary/12"
                    />
                </div>

                <div className="nav-right ml-auto flex items-center gap-2.5">
                    <Link
                        href={locale === 'en' ? '/ar' : '/en'}
                        className="nav-btn h-9 px-3.5 border-1.5 border-border rounded-full font-body text-[12px] font-medium tracking-wide flex items-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-mono"
                    >
                        {locale === 'en' ? 'عربي' : 'ENGLISH'}
                    </Link>

                    <ThemeToggle />

                    <button
                        suppressHydrationWarning
                        className="nav-btn h-9 px-2 border-1.5 border-border rounded-full flex items-center justify-center hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                    >
                        <Bell className="w-4.5 h-4.5" />
                    </button>

                    <button
                        suppressHydrationWarning
                        className="nav-btn h-9 px-4 bg-primary border-1.5 border-primary rounded-full text-white font-body text-[13px] font-semibold hover:bg-primary-dim hover:border-primary-dim transition-all"
                    >
                        {dict.common.login || 'Sign In'}
                    </button>
                </div>
            </div>
        </nav>
    )
}
