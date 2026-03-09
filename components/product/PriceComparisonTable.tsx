import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

interface VendorPrice {
    store: string;
    storeLogoUrl?: string;
    price: number;
    originalPrice: number;
    discount: number;
    inStock: boolean;
    hasCOD: boolean;
    hasTabby: boolean;
    isLowest?: boolean;
    affiliateUrl: string;
}

export function PriceComparisonTable({ prices }: { prices: VendorPrice[] }) {
    return (
        <div className="border rounded-xl overflow-hidden bg-card">
            <div className="bg-muted px-6 py-4 border-b">
                <h3 className="font-semibold text-lg">Compare Prices in UAE</h3>
            </div>
            <div className="divide-y">
                {prices.map((p, i) => (
                    <div key={i} className={`flex flex-col sm:flex-row items-center justify-between p-6 hover:bg-muted/30 transition-colors ${p.isLowest ? 'bg-primary/5' : ''}`}>
                        {/* Store Info */}
                        <div className="flex items-center w-full sm:w-1/3 mb-4 sm:mb-0">
                            <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center mr-4 text-xs font-bold shrink-0">
                                {/* Logo placeholder */}
                                {p.store.charAt(0)}
                            </div>
                            <div>
                                <span className="font-bold block">{p.store}</span>
                                <div className="flex items-center space-x-2 mt-1">
                                    {p.isLowest && <Badge className="bg-green-500 hover:bg-green-600 text-[10px] px-1.5 py-0 h-4">Best Price</Badge>}
                                    {p.inStock ? (
                                        <span className="flex items-center text-xs text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> In Stock</span>
                                    ) : (
                                        <span className="flex items-center text-xs text-red-500"><XCircle className="w-3 h-3 mr-1" /> Out of Stock</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Price Info */}
                        <div className="flex flex-col text-left sm:text-center w-full sm:w-1/3 mb-4 sm:mb-0">
                            <div className="flex items-baseline space-x-2 justify-start sm:justify-center">
                                <span className="text-2xl font-bold text-foreground">AED {p.price}</span>
                            </div>
                            {p.discount > 0 && (
                                <div className="text-sm text-muted-foreground line-through mt-0.5">AED {p.originalPrice}</div>
                            )}
                        </div>

                        {/* Action Config */}
                        <div className="flex flex-col items-end w-full sm:w-1/3 space-y-2">
                            <Link
                                href={p.affiliateUrl}
                                className={`w-full sm:w-auto text-center px-6 py-2.5 rounded-lg font-bold transition-colors ${p.isLowest ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                            >
                                View Deal
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {p.hasCOD && <span>✓ Cash on Delivery</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
