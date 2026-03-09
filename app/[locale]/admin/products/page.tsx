import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, PlusCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { GenerateSummaryButton } from '@/components/admin/GenerateSummaryButton'
import { deleteProduct } from '@/app/[locale]/admin/products/actions'

export default async function AdminProductsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const supabase = await createClient()

    // Fetch recent products with their category
    const { data: products, error } = await supabase
        .from('products')
        .select(`
      id,
      name_en,
      base_price,
      created_at,
      categories ( name_en )
    `)
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products Registry</h1>
                    <p className="text-muted-foreground">Manage and edit your global product catalog.</p>
                </div>
                <Link href={`/${locale}/admin/products/new`}>
                    <Button className="flex items-center space-x-2">
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Product</span>
                    </Button>
                </Link>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(!products || products.length === 0) ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No products found. Add products manually or sync APIs.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium text-primary">
                                        {product.name_en}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{(product.categories as any)?.name_en || 'Uncategorized'}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        AED {product.base_price?.toLocaleString() || 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(product.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <GenerateSummaryButton productId={product.id} locale={locale} />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <form action={async () => {
                                            "use server"
                                            await deleteProduct(product.id, locale)
                                        }} className="inline">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
