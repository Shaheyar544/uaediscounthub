import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-[70vh] w-full flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                <div className="relative bg-card border border-border w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl">
                    <FileQuestion className="w-12 h-12 text-primary" />
                </div>
            </div>

            <h1 className="text-[40px] md:text-[56px] font-display font-extrabold tracking-tight text-foreground mb-4">
                404 - Page Not Found
            </h1>

            <p className="text-muted-foreground text-lg max-w-[500px] mb-10 leading-relaxed">
                The deal you're looking for might have expired or moved to a new category. Let's get you back to the savings.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-dim hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
                >
                    <Home className="w-5 h-5" />
                    Back to Home
                </Link>

                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-foreground font-bold rounded-full hover:bg-border transition-all"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {[
                    { label: 'Trending Deals', href: '/en/deals' },
                    { label: 'Top Coupons', href: '/en/coupons' },
                    { label: 'Smartphones', href: '/en/category/smartphones' }
                ].map((link) => (
                    <Link
                        key={link.label}
                        href={link.href}
                        className="p-6 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all text-center"
                    >
                        <span className="font-bold text-foreground">{link.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
