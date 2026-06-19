'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart2, ArrowRight, Trash2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCompare } from '@/hooks/use-compare'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

interface ComparisonProduct {
  id: string
  name_en: string
  image_url: string | null
}

export function CompareBar({ locale = 'en' }: { locale?: string }) {
  const router = useRouter()
  const { compareIds, removeFromCompare, clearCompare, warning, clearWarning } = useCompare()
  const [products, setProducts] = useState<ComparisonProduct[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (compareIds.length === 0) {
      setProducts([])
      return
    }

    const fetchDetails = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, image_url')
        .in('id', compareIds)

      if (!error && data) {
        // Maintain the order of compareIds
        const ordered = compareIds
          .map((id) => data.find((p) => p.id === id))
          .filter(Boolean) as ComparisonProduct[]
        setProducts(ordered)
      }
      setLoading(false)
    }

    fetchDetails()
  }, [compareIds, supabase])

  if (compareIds.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 Pointer-events-none"
      >
        <div className="max-w-5xl mx-auto pointer-events-auto">
          {/* Warning Toast */}
          <AnimatePresence>
            {warning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-3 mx-auto max-w-xs bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center justify-between gap-3 text-sm font-bold"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{warning}</span>
                </div>
                <button onClick={clearWarning}>
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
            <div className="flex flex-col md:flex-row items-stretch md:items-center">
              {/* Items List */}
              <div className="flex-1 flex items-center gap-3 p-3 overflow-x-auto scrollbar-hide">
                <div className="hidden md:flex flex-col items-center justify-center px-4 border-r border-gray-100 dark:border-gray-800 mr-2">
                  <BarChart2 className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Compare</span>
                </div>

                {products.length === 0 && loading ? (
                  <div className="flex-1 flex gap-3">
                    {[1, 2].map(i => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="group relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-1"
                    >
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name_en}
                          width={60}
                          height={60}
                          className="object-contain max-h-full"
                        />
                      ) : (
                        <div className="text-[8px] text-center font-bold text-gray-300 px-1 truncate w-full">
                          {product.name_en}
                        </div>
                      )}
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}

                {/* Slots for empty items */}
                {Array.from({ length: 4 - products.length }).map((_, i) => (
                  <div
                    key={`slot-${i}`}
                    className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-300"
                  >
                    <PlusIcon className="w-4 h-4 opacity-50" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-900/50 md:bg-transparent border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800">
                <button
                  onClick={clearCompare}
                  className="hidden md:flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-3 py-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>

                <Button
                  onClick={() => router.push(`/${locale}/compare?ids=${compareIds.join(',')}`)}
                  disabled={compareIds.length < 2}
                  className="flex-1 md:flex-none h-12 md:h-14 px-6 md:px-8 rounded-xl font-black uppercase tracking-wider gap-3 shadow-lg shadow-blue-500/20"
                >
                  <span className="md:hidden">Compare {compareIds.length}</span>
                  <span className="hidden md:inline">Compare Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}
