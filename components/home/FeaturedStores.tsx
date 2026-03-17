"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

interface Store {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    deals_count?: number
}

interface FeaturedStoresProps {
    stores: Store[]
}

export function FeaturedStores({ stores }: FeaturedStoresProps) {
    return (
        <section className="stores-section mb-10">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-[18px] font-bold text-foreground">Featured Stores</h3>
                <Link href="/stores" className="text-[13px] font-semibold text-primary hover:underline">
                    View All Stores →
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stores.map((store, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        viewport={{ once: true }}
                        key={store.id}
                    >
                        <Link
                            href={`/coupons/${store.slug}`}
                            className="store-card group flex items-center gap-4 p-3.5 bg-card border border-border rounded-xl hover:shadow-card-hover hover:border-primary/40 transition-all duration-300"
                        >
                            <div className="store-logo w-[52px] h-[52px] bg-white border border-border rounded-lg flex items-center justify-center p-2.5 shrink-0 transition-transform group-hover:scale-105">
                                {store.logo_url ? (
                                    <img
                                        src={store.logo_url}
                                        alt={store.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                            const parent = e.currentTarget.parentElement
                                            if (parent && !parent.querySelector('.store-initial')) {
                                                const span = document.createElement('span')
                                                span.className = 'store-initial text-[18px] font-bold text-gray-500'
                                                span.textContent = store.name.charAt(0).toUpperCase()
                                                parent.appendChild(span)
                                            }
                                        }}
                                    />
                                ) : (
                                    <span className="text-[18px] font-bold text-gray-500">
                                        {store.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="store-info flex flex-col justify-center overflow-hidden">
                                <span className="store-name font-bold text-[14px] text-foreground truncate group-hover:text-primary transition-colors">
                                    {store.name}
                                </span>
                                <span className="store-meta text-[11px] text-muted-foreground font-medium">
                                    {store.deals_count || 'View'} active deals
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

