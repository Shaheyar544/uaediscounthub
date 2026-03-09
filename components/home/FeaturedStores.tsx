"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const STORES = [
    { id: 'amazon-ae', name: 'Amazon UAE', logo: '/stores/amazon-ae.png' },
    { id: 'noon', name: 'Noon', logo: '/stores/noon.png' },
    { id: 'sharaf-dg', name: 'Sharaf DG', logo: '/stores/sharaf-dg.png' },
    { id: 'carrefour', name: 'Carrefour', logo: '/stores/carrefour.png' },
    { id: 'jarir', name: 'Jarir Bookstore', logo: '/stores/jarir.png' },
]

export function FeaturedStores() {
    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Featured Stores</h2>
                <Link href="/stores" className="text-sm font-medium text-primary hover:underline">
                    View all stores
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {STORES.map((store, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={store.id}
                    >
                        <Link
                            href={`/coupons/${store.id}`}
                            className="group flex flex-col items-center justify-center p-6 border rounded-xl hover:shadow-md transition-all bg-card hover:border-primary/50"
                        >
                            <div className="w-16 h-16 rounded-xl bg-white mb-4 shadow-sm border p-2 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                                <Image
                                    src={store.logo}
                                    alt={store.name}
                                    width={64}
                                    height={64}
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-semibold text-sm text-center group-hover:text-primary transition-colors">{store.name}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
