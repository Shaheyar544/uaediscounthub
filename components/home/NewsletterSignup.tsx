"use client"

import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useTransition } from 'react'
import { subscribeToNewsletter } from '@/app/actions/newsletter'

export function NewsletterSignup() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [message, setMessage] = useState('')
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('email', email)

        startTransition(async () => {
            const result = await subscribeToNewsletter(formData)
            if (result.success) {
                setSubmitted(true)
                setMessage(result.message || 'Successfully subscribed!')
            } else {
                alert(result.error)
            }
        })
    }

    return (
        <section className="my-16 relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/20">
            <div className="absolute top-0 right-0 -tr-translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />

            <div className="px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 z-10 relative">
                <div className="max-w-xl text-center md:text-left space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-2">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Never Miss a Price Drop 🔔
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Join 50,000+ tech lovers in the GCC. Get the best unmissable electronics deals sent straight to your inbox before they sell out.
                    </p>
                </div>

                <div className="w-full max-w-md">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                            <Input
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                className="h-12 bg-background border-primary/20 focus-visible:ring-primary/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isPending}
                                suppressHydrationWarning
                            />
                            <motion.div whileTap={{ scale: 0.95 }}>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="h-12 w-full sm:w-auto font-semibold"
                                    disabled={isPending}
                                    suppressHydrationWarning
                                >
                                    {isPending ? 'Subscribing...' : 'Subscribe'}
                                </Button>
                            </motion.div>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 p-4 rounded-xl border border-green-200 dark:border-green-800 text-center font-medium"
                        >
                            🎉 {message}
                        </motion.div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3 text-center sm:text-left">
                        We respect your privacy. No spam, just deals.
                    </p>
                </div>
            </div>
        </section>
    )
}
