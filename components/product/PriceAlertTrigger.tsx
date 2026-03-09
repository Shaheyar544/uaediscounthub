"use client"

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BellRing, CheckCircle2, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function PriceAlertTrigger({ productId, productName }: { productId: string, productName: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [phone, setPhone] = useState('')
    const [targetPrice, setTargetPrice] = useState('')
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [isPending, startTransition] = useTransition()

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            // In a real app, this would call a server action to save the alert to the `price_alerts` table
            // For this demo, we'll trigger the WhatsApp API directly as a proof-of-concept
            const response = await fetch('/api/alerts/trigger-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phone,
                    productName: productName,
                    oldPrice: "Current",
                    newPrice: targetPrice
                })
            })

            if (response.ok) {
                setStatus('success')
                setTimeout(() => {
                    setIsOpen(false)
                    setStatus('idle')
                }, 3000)
            } else {
                setStatus('error')
                alert("Could not set alert. Please check your number format.")
            }
        })
    }

    return (
        <div className="mt-6 border rounded-xl p-4 bg-muted/30">
            {!isOpen ? (
                <Button
                    variant="outline"
                    className="w-full flex items-center justify-center space-x-2 py-6 border-dashed border-2 hover:border-primary/50"
                    onClick={() => setIsOpen(true)}
                >
                    <BellRing className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">Track Price Drop via WhatsApp</span>
                </Button>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-green-500" />
                                GCC WhatsApp Alerts
                            </h4>
                            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                        </div>

                        {status === 'success' ? (
                            <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Success! You'll be notified at {phone} when price hits {targetPrice} AED.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Phone (with area code)</label>
                                        <Input
                                            placeholder="+9715..."
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground ml-1">Target Price (AED)</label>
                                        <Input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={targetPrice}
                                            onChange={(e) => setTargetPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isPending}>
                                    {isPending ? 'Connecting...' : 'Activate Alert'}
                                </Button>
                            </form>
                        )}
                        <p className="text-[10px] text-muted-foreground text-center">
                            Powered by Twilio WhatsApp API. Standard rates apply. Zero spam guarantee.
                        </p>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}
