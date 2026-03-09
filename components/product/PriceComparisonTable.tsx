import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, TrendingDown, Truck, CreditCard, ChevronRight } from 'lucide-react'

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
        <div className="price-comparison-container my-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="table-header bg-secondary/50 px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-foreground">Live Price Comparison</h3>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Prices updated 2hr ago</span>
            </div>

            <div className="table-body divide-y divide-border/60">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-6 py-3 bg-secondary/20 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div>Store</div>
                    <div>Delivery Status</div>
                    <div>COD / Tabby</div>
                    <div className="text-center">Current Price</div>
                    <div className="text-right">Action</div>
                </div>

                {prices.map((p, i) => (
                    <div
                        key={i}
                        className={`group transition-all duration-300 ${p.isLowest ? 'bg-primary/5' : 'hover:bg-secondary/30'}`}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center px-6 py-5 gap-4">
                            {/* Store */}
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white border border-border rounded-lg flex items-center justify-center p-2 shadow-sm transition-transform group-hover:scale-105">
                                    {p.storeLogoUrl ? (
                                        <Image src={p.storeLogoUrl} alt={p.store} width={32} height={32} className="object-contain" />
                                    ) : (
                                        <span className="text-[14px] font-bold text-primary">{p.store[0]}</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-[15px] text-foreground">{p.store}</span>
                                    {p.isLowest && (
                                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                            <TrendingDown className="w-2.5 h-2.5" /> LOWEST PRICE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Delivery */}
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                                <Truck className="w-4 h-4 text-muted-foreground/50" />
                                {p.inStock ? (
                                    <span className="text-brand-green">Express Delivery</span>
                                ) : (
                                    <span>2-3 Days</span>
                                )}
                            </div>

                            {/* COD/Tabby */}
                            <div className="flex items-center gap-2">
                                {p.hasCOD && (
                                    <Badge variant="outline" className="text-[10px] font-bold border-border/60 bg-secondary/30">COD</Badge>
                                )}
                                {p.hasTabby && (
                                    <Badge variant="outline" className="text-[10px] font-bold border-border/60 bg-secondary/30 flex items-center gap-1">
                                        <CreditCard className="w-2.5 h-2.5" /> Tabby
                                    </Badge>
                                )}
                            </div>

                            {/* Price */}
                            <div className="text-center">
                                <div className="text-[20px] font-extrabold text-foreground leading-none">
                                    AED {p.price?.toLocaleString()}
                                </div>
                                {p.discount > 0 && (
                                    <div className="text-[12px] text-muted-foreground line-through mt-1 font-medium">
                                        AED {p.originalPrice?.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div className="text-right">
                                <Link
                                    href={p.affiliateUrl}
                                    className={`inline-flex items-center gap-2 h-10 px-5 rounded-full font-bold text-[13.5px] transition-all ${p.isLowest
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dim hover:-translate-y-0.5'
                                            : 'bg-secondary text-foreground hover:bg-border transition-all'
                                        }`}
                                >
                                    Go to Store
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

