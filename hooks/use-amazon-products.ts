'use client'

import { useState, useCallback } from 'react'
import { AmazonProduct } from '@/lib/amazon-creators-api'

export function useAmazonProducts() {
    const [products, setProducts] = useState<AmazonProduct[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const search = useCallback(async (query: string) => {
        if (!query) return
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/amazon/search?q=${encodeURIComponent(query)}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to search Amazon products')
            setProducts(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    const getProduct = useCallback(async (asin: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/amazon/product?asin=${asin}`)
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to fetch Amazon product')
            return data as AmazonProduct
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        products,
        loading,
        error,
        search,
        getProduct
    }
}
