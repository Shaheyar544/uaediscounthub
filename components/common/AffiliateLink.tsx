'use client'

import React from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'

interface AffiliateLinkProps {
    href: string
    productId?: string
    productName?: string
    storeName?: string
    children: React.ReactNode
    className?: string
    style?: React.CSSProperties
}

export function AffiliateLink({
    href,
    productId,
    productName,
    storeName,
    children,
    className,
    style
}: AffiliateLinkProps) {
    const handleClick = () => {
        // Track click event in PostHog
        posthog.capture('affiliate_click', {
            product_id: productId,
            product_name: productName,
            store: storeName,
            url: href
        })
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={handleClick}
            className={className}
            style={style}
        >
            {children}
        </a>
    )
}
