"use client"

import { CheckCircle2, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProsConsGridProps {
  pros?: string[]
  cons?: string[]
}

// FIX 6: Only render when real data exists — no fake hardcoded fallbacks
export function ProsConsGrid({ pros, cons }: ProsConsGridProps) {
  const hasPros = pros && pros.length > 0
  const hasCons = cons && cons.length > 0

  if (!hasPros && !hasCons) return null

  return (
    <div className="pros-cons-grid grid grid-cols-1 md:grid-cols-2 gap-5 my-10">
      {hasPros && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="pros-col bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-brand-green" />
            </div>
            <h3 className="text-[17px] font-bold text-foreground">Why you&apos;ll love it</h3>
          </div>
          <ul className="space-y-3.5">
            {pros!.map((pro, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                <span className="text-[14.5px] font-medium text-foreground/80 leading-relaxed">{pro}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {hasCons && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="cons-col bg-brand-red/5 border border-brand-red/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-brand-red/10 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-brand-red" />
            </div>
            <h3 className="text-[17px] font-bold text-foreground">Things to consider</h3>
          </div>
          <ul className="space-y-3.5">
            {cons!.map((con, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                <span className="text-[14.5px] font-medium text-foreground/80 leading-relaxed">{con}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}
