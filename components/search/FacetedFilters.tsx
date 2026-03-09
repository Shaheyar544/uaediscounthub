"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export function FacetedFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [priceRange, setPriceRange] = useState([
        Number(searchParams.get('minPrice')) || 0,
        Number(searchParams.get('maxPrice')) || 10000
    ])

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set(name, value)
            } else {
                params.delete(name)
            }
            return params.toString()
        },
        [searchParams]
    )

    const handlePriceChange = (value: number[]) => {
        setPriceRange(value)
        const params = new URLSearchParams(searchParams.toString())
        params.set('minPrice', value[0].toString())
        params.set('maxPrice', value[1].toString())
        router.push(pathname + '?' + params.toString())
    }

    const toggleFilter = (category: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const current = params.get(category)
        const values = current ? current.split(',') : []

        const index = values.indexOf(value)
        if (index > -1) {
            values.splice(index, 1)
        } else {
            values.push(value)
        }

        if (values.length > 0) {
            params.set(category, values.join(','))
        } else {
            params.delete(category)
        }

        router.push(pathname + '?' + params.toString())
    }

    const isChecked = (category: string, value: string) => {
        const current = searchParams.get(category)
        return current ? current.split(',').includes(value) : false
    }

    return (
        <aside className="w-full md:w-64 space-y-8 pr-6 border-r pr-6 mb-8 md:mb-0">
            <div>
                <h3 className="font-semibold text-lg mb-4 text-foreground">Price Range (AED)</h3>
                <Slider
                    value={priceRange}
                    max={10000}
                    step={100}
                    onValueChange={(val: any) => setPriceRange(val)}
                    onValueCommitted={(val: any) => handlePriceChange(val)}
                    className="mb-6"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
                    <span>AED {priceRange[0]}</span>
                    <span>AED {priceRange[1]}</span>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4 text-foreground">Brands</h3>
                <div className="space-y-3">
                    {['Apple', 'Samsung', 'Sony', 'Lenovo', 'Huawei'].map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                            <Checkbox
                                id={`brand-${brand}`}
                                checked={isChecked('brand', brand)}
                                onCheckedChange={() => toggleFilter('brand', brand)}
                            />
                            <label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {brand}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4 text-foreground">RAM Size</h3>
                <div className="space-y-3">
                    {['4GB', '8GB', '16GB', '32GB'].map((ram) => (
                        <div key={ram} className="flex items-center space-x-2">
                            <Checkbox
                                id={`ram-${ram}`}
                                checked={isChecked('ram', ram)}
                                onCheckedChange={() => toggleFilter('ram', ram)}
                            />
                            <label htmlFor={`ram-${ram}`} className="text-sm font-medium leading-none">
                                {ram}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4 text-foreground">Storage</h3>
                <div className="space-y-3">
                    {['128GB', '256GB', '512GB', '1TB'].map((storage) => (
                        <div key={storage} className="flex items-center space-x-2">
                            <Checkbox
                                id={`storage-${storage}`}
                                checked={isChecked('storage', storage)}
                                onCheckedChange={() => toggleFilter('storage', storage)}
                            />
                            <label htmlFor={`storage-${storage}`} className="text-sm font-medium leading-none">
                                {storage}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    )
}
