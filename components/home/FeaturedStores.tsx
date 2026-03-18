'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  deals_count?: number
}

export function FeaturedStores({ stores }: { stores: Store[] }) {
  return (
    <section className="py-12 px-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Shop Top Stores</h2>
          <p className="text-gray-500 text-sm mt-1">Verified authorized retailers in UAE</p>
        </div>
        <Link href="/en/stores" className="text-blue-600 font-bold text-sm hover:underline">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stores.map((store, i) => (
          <motion.a
            key={store.id}
            href={`/en/coupons/${store.slug}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
            className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-blue-200 p-4 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
          >
            <div className="w-full h-14 flex items-center justify-center mb-3">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="max-h-10 max-w-full object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-lg">
                  {store.name[0]}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="font-bold text-sm text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                {store.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {store.deals_count || 0} active deals
              </div>
            </div>

            <div className="absolute inset-0 bg-blue-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.a>
        ))}
      </div>
    </section>
  )
}
