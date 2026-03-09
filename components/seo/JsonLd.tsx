import React from 'react'

interface JsonLdProps {
    data: any
}

export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    )
}

export function ProductSchema({ product, locale }: { product: any; locale: string }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name_en || product.name,
        image: product.image_url,
        description: product.description_en || product.ai_summary_en,
        sku: product.id,
        brand: {
            '@type': 'Brand',
            name: product.brands?.name || 'UAEDiscountHub'
        },
        offers: {
            '@type': 'AggregateOffer',
            url: `https://uaediscounthub.com/${locale}/product/${product.slug}`,
            priceCurrency: 'AED',
            lowPrice: product.base_price,
            highPrice: product.base_price,
            offerCount: 1,
            availability: 'https://schema.org/InStock'
        }
    }

    return <JsonLd data={schema} />
}

export function BreadcrumbSchema({ items }: { items: { name: string; item: string }[] }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.item
        }))
    }

    return <JsonLd data={schema} />
}
