import Link from 'next/link'
import { Locale } from '@/i18n/config'
import { createClient } from '@/utils/supabase/server'
import { SocialButtons } from './SocialButtons'

export async function Footer({ locale }: { locale: Locale }) {
    const supabase = await createClient();

    const { data: footerPages } = await supabase
        .from('pages')
        .select('slug, title_en, title_ar, placement')
        .in('placement', ['footer_c1', 'footer_c2', 'footer_c3'])
        .eq('is_visible', true)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

    const quickLinks = footerPages?.filter(p => p.placement === 'footer_c1') || [];
    const storesPages = footerPages?.filter(p => p.placement === 'footer_c2') || [];
    const connectPages = footerPages?.filter(p => p.placement === 'footer_c3') || [];

    return (
        <footer className="footer bg-card border-t border-border pt-12 pb-6">
            <div className="footer-inner max-w-[1280px] mx-auto px-6">
                <div className="footer-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 mb-10">
                    <div className="footer-brand flex flex-col gap-3">
                        <div className="footer-brand-name font-display text-[18px] font-extrabold tracking-tight flex items-center gap-2">
                            <div className="logo-dot w-2 h-2 rounded-full bg-primary" />
                            UAEDiscountHub
                        </div>
                        <div className="footer-brand-desc text-[13.5px] text-muted-foreground leading-relaxed max-w-[240px]">
                            AI-powered price comparison and deals platform for the UAE, KSA, and GCC. Find the best tech deals before anyone else.
                        </div>
                        <SocialButtons />
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Quick Links</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            {quickLinks.map(page => (
                                <li key={page.slug}>
                                    <Link href={`/${locale}/${page.slug}`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">
                                        {locale === 'ar' ? page.title_ar || page.title_en : page.title_en}
                                    </Link>
                                </li>
                            ))}
                            {/* Static defaults if empty */}
                            {quickLinks.length === 0 && (
                                <>
                                    <li><Link href={`/${locale}/deals`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Today's Deals</Link></li>
                                    <li><Link href={`/${locale}/blog`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Tech Blog</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Stores</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            {storesPages.map(page => (
                                <li key={page.slug}>
                                    <Link href={`/${locale}/${page.slug}`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">
                                        {locale === 'ar' ? page.title_ar || page.title_en : page.title_en}
                                    </Link>
                                </li>
                            ))}
                            {storesPages.length === 0 && (
                                <>
                                    <li><Link href={`/${locale}/coupons/amazon-ae`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Amazon UAE</Link></li>
                                    <li><Link href={`/${locale}/coupons/noon`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Noon</Link></li>
                                    <li><Link href={`/${locale}/coupons/sharaf-dg`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Sharaf DG</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Connect</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            {connectPages.map(page => (
                                <li key={page.slug}>
                                    <Link href={`/${locale}/${page.slug}`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">
                                        {locale === 'ar' ? page.title_ar || page.title_en : page.title_en}
                                    </Link>
                                </li>
                            ))}
                            {connectPages.length === 0 && (
                                <>
                                    <li><Link href={`/${locale}/about`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">About Us</Link></li>
                                    <li><Link href={`/${locale}/contact`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Contact Us</Link></li>
                                    <li><Link href={`/${locale}/privacy-policy`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Privacy Policy</Link></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div>
                         {/* Optional 5th column if needed, or keep empty for grid balance */}
                    </div>
                </div>

                <div className="footer-bottom border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="footer-copy text-[12.5px] text-muted-foreground text-center md:text-left">
                        © {new Date().getFullYear()} UAEDiscountHub · All rights reserved · Dubai, UAE
                    </div>
                    <div className="footer-badges flex gap-2">
                        {['🔒 SSL Secured', '🇦🇪 UAE Based', '🤖 AI Powered'].map((b, i) => (
                            <span key={i} className="footer-badge text-[10.5px] font-semibold text-muted-foreground bg-secondary border border-border px-2.5 py-1 rounded-sm">
                                {b}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
