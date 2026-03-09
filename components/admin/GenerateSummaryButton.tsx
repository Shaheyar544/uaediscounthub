"use client"

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateAISummaryForProduct } from '@/app/[locale]/admin/products/actions'

export function GenerateSummaryButton({ productId, locale }: { productId: string, locale: string }) {
    const [isPending, startTransition] = useTransition()

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
            disabled={isPending}
            onClick={() => {
                startTransition(async () => {
                    const res = await generateAISummaryForProduct(productId, locale)
                    if (!res.success) {
                        alert(res.error || "Failed to generate AI Summary")
                    }
                })
            }}
            title="Generate DeepSeek AI Summary"
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </Button>
    )
}
