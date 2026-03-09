"use client"

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_placeholder', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
    })
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
