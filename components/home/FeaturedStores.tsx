"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'

const STORES = [
    { id: 'amazon-ae', name: 'Amazon UAE', color: 'bg-orange-500' },
    { id: 'noon', name: 'Noon', color: 'bg-yellow-400' },
    { id: 'sharaf-dg', name: 'Sharaf DG', color: 'bg-blue-600' },
    { id: 'carrefour', name: 'Carrefour', color: 'bg-blue-500' },
    { id: 'jarir', name: 'Jarir Bookstore', color: 'bg-red-600' },
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
                            <div className={`w-12 h-12 rounded-full ${store.color} mb-3 shadow-inner flex items-center justify-center text-white font-bold text-xs`}>
                                {store.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-sm text-center group-hover:text-primary transition-colors">{store.name}</span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
