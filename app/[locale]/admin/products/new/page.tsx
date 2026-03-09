import { addProduct } from './actions'
import { createClient } from '@/utils/supabase/server'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewProductPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { locale } = await params
    const { error } = await searchParams
    const supabase = await createClient()

    // Fetch categories so the admin can pick them in the dropdown
    const { data: categories } = await supabase.from('categories').select('id, name_en').order('name_en')

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center space-x-4 mb-8">
                <Link href={`/${locale}/admin/products`} className="text-muted-foreground hover:text-primary">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
                    <p className="text-muted-foreground">Fill in the details to publish a new tech deal.</p>
                </div>
            </div>

            <form action={addProduct} className="bg-card text-card-foreground border rounded-xl p-8 space-y-6 shadow-sm">
                <input type="hidden" name="locale" value={locale} />

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input id="name" name="name" placeholder="e.g. Apple iPhone 15 Pro" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input id="slug" name="slug" placeholder="e.g. apple-iphone-15-pro" required />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="category_id">Category</Label>
                        <select
                            id="category_id"
                            name="category_id"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select Category...</option>
                            {categories?.map(c => (
                                <option key={c.id} value={c.id}>{c.name_en}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="base_price">Base Price (AED)</Label>
                        <Input id="base_price" name="base_price" type="number" step="0.01" placeholder="e.g. 4299.00" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input id="image_url" name="image_url" placeholder="https://cdn.example.com/iphone.png" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Detailed description of the product features."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="specs">Technical Specs (JSON format)</Label>
                    <textarea
                        id="specs"
                        name="specs"
                        rows={4}
                        className="font-mono flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={'{\n  "RAM": "8GB",\n  "Storage": "256GB"\n}'}
                    />
                </div>

                <div className="pt-4 flex justify-end space-x-4 border-t">
                    <Link href={`/${locale}/admin/products`} className="flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        Cancel
                    </Link>
                    <Button type="submit">Save Product</Button>
                </div>
            </form>
        </div>
    )
}
