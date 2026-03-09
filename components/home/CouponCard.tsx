"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ExternalLink, Ticket } from 'lucide-react'
import Image from 'next/image'
import { useHasMounted } from '@/hooks/use-has-mounted'

interface CouponCardProps {
    id: string
    storeName: string
    storeLogo: string
    discount: string
    description: string
    code: string
    expiry?: string
    color?: string
}

export function CouponCard({
    id, storeName, storeLogo, discount,
    description, code, expiry, color = "#0A84FF"
}: CouponCardProps) {
    const [copied, setCopied] = useState(false)
    const hasMounted = useHasMounted()

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="coupon-card group bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover hover:border-primary/30 transition-all duration-300"
        >
            <div className="p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white border border-border rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                            <Image src={storeLogo} alt={storeName} width={24} height={24} className="object-contain" />
                        </div>
                        <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{storeName}</span>
                    </div>
                    <div
                        className="text-[11px] font-extrabold px-2 py-0.5 rounded-sm text-white shadow-sm"
                        style={{ backgroundColor: color }}
                    >
                        {discount}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                    <h4 className="text-[14.5px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                        {discount} {storeName} Discount
                    </h4>
                    <p className="text-[12.5px] text-muted-foreground line-clamp-1">{description}</p>
                </div>

                {/* Code Area */}
                <div className="coupon-code-area relative mt-1">
                    <div className="absolute inset-0 bg-secondary/50 rounded-lg border-2 border-dashed border-border" />
                    <div className="relative flex items-center justify-between px-3 py-2.5">
                        <span className="font-mono text-[14px] font-bold text-foreground tracking-widest">{code}</span>
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-dim transition-colors ${!hasMounted ? 'invisible' : 'visible'}`}
                        >
                            <AnimatePresence mode="wait">
                                {copied ? (
                                    <motion.span
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1"
                                    >
                                        <Check className="w-3.5 h-3.5 text-brand-green" /> COPIED
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="copy"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> COPY
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" /> 104 used today
                    </span>
                    {expiry && <span>Exp: {expiry}</span>}
                </div>
            </div>
        </motion.div>
    )
}
