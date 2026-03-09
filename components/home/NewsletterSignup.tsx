"use client"

import { motion } from 'framer-motion'
import { Bell, Send, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

export function NewsletterSignup() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('email', email)

        startTransition(async () => {
            const result = await subscribeToNewsletter(formData)
            if (result.success) {
                setSubmitted(true)
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <section className="newsletter-section relative overflow-hidden my-16 rounded-[28px] bg-[#0D1117] px-8 py-14">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-[900px] mx-auto flex flex-col items-center text-center gap-8">
                <div className="newsletter-header space-y-4">
                    <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/12 px-4 py-1.5 rounded-full shadow-inner">
                        <Bell className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11.5px] font-bold text-white/50 tracking-wider uppercase">Join 50K+ Smart Shoppers</span>
                    </div>
                    <h2 className="font-display text-[32px] md:text-[40px] font-extrabold text-white leading-tight">
                        Never Miss a <em className="not-italic text-primary">Price Drop</em> 🔔
                    </h2>
                    <p className="text-[16px] text-white/50 max-w-[500px] mx-auto leading-relaxed">
                        Get the best unmissable electronics deals & coupons sent straight to your inbox before they sell out.
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="newsletter-form w-full max-w-[500px] flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <input
                                suppressHydrationWarning
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 bg-white/8 border border-white/15 rounded-full px-6 font-body text-[14.5px] text-white placeholder:text-white/30 outline-none focus:border-primary focus:bg-white/12 transition-all shadow-xl"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            suppressHydrationWarning
                            disabled={isPending}
                            className="h-12 px-8 bg-primary rounded-full text-white font-body text-[14.5px] font-bold shadow-lg hover:bg-primary-dim hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            {isPending ? 'Joining...' : 'Get Best Deals'}
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex flex-col items-center gap-2"
                    >
                        <CheckCircle2 className="w-10 h-10 text-brand-green" />
                        <h4 className="text-[18px] font-bold text-white">You're in the loop!</h4>
                        <p className="text-[14px] text-white/60 text-center">We'll notify you when the biggest price drops happen.</p>
                    </motion.div>
                )}

                <div className="newsletter-footer flex flex-wrap justify-center gap-6 mt-2 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                    <div className="flex items-center gap-2 text-[12px] text-white font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> No Spam, ever
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-white font-medium underline decoration-primary/30">
                        1-Click Unsubscribe
                    </div>
                </div>
            </div>
        </section>
    )
}

