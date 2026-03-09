import Link from 'next/link'
import { Locale } from '@/i18n/config'
import { Twitter, Linkedin, Instagram, MessageCircle } from 'lucide-react'

export function Footer({ locale }: { locale: Locale }) {
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
                        <div className="footer-socials flex gap-2 mt-1">
                            {[
                                { icon: <Twitter className="w-3.5 h-3.5" />, label: 'X' },
                                { icon: <Linkedin className="w-3.5 h-3.5" />, label: 'LinkedIn' },
                                { icon: <Instagram className="w-3.5 h-3.5" />, label: 'Instagram' },
                                { icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'WhatsApp' }
                            ].map((s, i) => (
                                <button
                                    key={i}
                                    suppressHydrationWarning
                                    className="footer-social-btn w-[34px] h-[34px] border border-border rounded-sm flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                >                                    {s.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Categories</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            <li><Link href={`/${locale}/category/smartphones`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Smartphones</Link></li>
                            <li><Link href={`/${locale}/category/laptops`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Laptops</Link></li>
                            <li><Link href={`/${locale}/category/audio`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">TVs & Audio</Link></li>
                            <li><Link href={`/${locale}/category/home-appliances`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Home Appliances</Link></li>
                            <li><Link href={`/${locale}/category-smarthome`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Smart Home</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Quick Links</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            <li><Link href={`/${locale}/deals`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Today's Deals</Link></li>
                            <li><Link href={`/${locale}/coupons`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Promo Codes</Link></li>
                            <li><Link href={`/${locale}/compare`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Price Comparison</Link></li>
                            <li><Link href={`/${locale}/history`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Price History</Link></li>
                            <li><Link href={`/${locale}/blog`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Tech Blog</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Stores</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            <li><Link href={`/${locale}/coupons/amazon-ae`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Amazon UAE</Link></li>
                            <li><Link href={`/${locale}/coupons/noon`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Noon</Link></li>
                            <li><Link href={`/${locale}/coupons/sharaf-dg`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Sharaf DG</Link></li>
                            <li><Link href={`/${locale}/coupons/carrefour`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Carrefour</Link></li>
                            <li><Link href={`/${locale}/coupons/jarir`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Jarir</Link></li>
                        </ul>
                    </div>

                    <div>
                        <div className="footer-col-title text-[13px] font-bold text-foreground mb-3.5 tracking-wide">Connect</div>
                        <ul className="footer-links list-none flex flex-col gap-2.5">
                            <li><Link href={`/${locale}/whatsapp`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">WhatsApp Alerts</Link></li>
                            <li><Link href={`/${locale}/contact`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Contact Us</Link></li>
                            <li><Link href={`/${locale}/privacy`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Privacy Policy</Link></li>
                            <li><Link href={`/${locale}/terms`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Terms of Use</Link></li>
                            <li><Link href={`/${locale}/affiliate`} className="text-[13.5px] text-muted-foreground hover:text-primary transition-all">Affiliate Info</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="footer-copy text-[12.5px] text-muted-foreground text-center md:text-left" suppressHydrationWarning>
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

