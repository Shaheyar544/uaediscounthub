import Link from 'next/link'
import { Locale } from '@/i18n/config'

export function Footer({ locale }: { locale: Locale }) {
    return (
        <footer className="border-t bg-muted/20">
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-primary">UAEDISCOUNTHUB</h3>
                        <p className="text-sm text-muted-foreground">Your trusted destination for the best tech deals in the UAE and GCC.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Categories</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${locale}/category/smartphones`}>Smartphones</Link></li>
                            <li><Link href={`/${locale}/category/laptops`}>Laptops</Link></li>
                            <li><Link href={`/${locale}/category/home-appliances`}>Home Appliances</Link></li>
                            <li><Link href={`/${locale}/category/audio`}>Audio Products</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href={`/${locale}`}>Today's Deals</Link></li>
                            <li><Link href={`/${locale}/coupons`}>Promo Codes</Link></li>
                            <li><Link href={`/${locale}/compare`}>Comparison Engine</Link></li>
                            <li><Link href={`/${locale}/blog`}>Tech Guides</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Connect</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/">Contact Us</Link></li>
                            <li><Link href="/">Twitter</Link></li>
                            <li><Link href="/">Facebook</Link></li>
                            <li><Link href="/">WhatsApp Alerts</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} UAEDISCOUNTHUB. All rights reserved.
                </div>
            </div>
        </footer>
    )
}
