"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function AffiliateRedirectPage() {
    const router = useRouter()
    const params = useParams()
    const store = params?.store as string
    const hash = params?.hash as string

    useEffect(() => {
        // 1. Log click in analytics / database
        console.log(`[Analytics] Tracked click out to ${store} for hash ${hash}`)

        // 2. Fire affiliate cookie if necessary (handled by the actual final URL structure)
        // 3. Perform redirect after a short delay so the analytics script fires
        const timer = setTimeout(() => {
            // Dummy mapping for demo. Real app queries Supabase for the URL based on hash
            const targetUrl = store.toLowerCase() === 'amazon'
                ? 'https://amazon.ae'
                : store.toLowerCase() === 'noon'
                    ? 'https://noon.com'
                    : 'https://google.com'

            window.location.href = targetUrl
        }, 1500)

        return () => clearTimeout(timer)
    }, [store, hash, router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-6">
            <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Taking you to {store}...</h1>
                <p className="text-muted-foreground">Securing the best price and activating your affiliate discount.</p>
            </div>
        </div>
    )
}
