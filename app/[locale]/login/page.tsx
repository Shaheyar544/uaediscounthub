import { login, signup } from './actions'
import { Locale } from '@/i18n/config'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default async function LoginPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ message?: string, error?: string }>
}) {
    const { locale } = await params
    const { message, error } = await searchParams

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto py-24">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-primary">Sign in to UAEDISCOUNTHUB Admin</h1>
            <p className="text-muted-foreground text-sm mb-6">Enter your details to manage products, coupons, and view analytics.</p>

            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground">

                {/* Hidden field to pass locale to server action */}
                <input type="hidden" name="locale" value={locale} />

                <div className="flex border flex-col rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                    <Input
                        name="email"
                        placeholder="admin@uaediscounthub.com"
                        required
                        className="border-0 border-b rounded-none px-4 py-6 focus-visible:ring-0 shadow-none bg-background/50"
                    />
                    <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        className="border-0 rounded-none px-4 py-6 focus-visible:ring-0 shadow-none bg-background/50"
                    />
                </div>

                <Button formAction={login} type="submit" className="w-full mt-2" size="lg">
                    Sign In
                </Button>
                <Button formAction={signup} type="submit" variant="outline" className="w-full" size="lg">
                    Sign Up (Demo)
                </Button>

                {message && (
                    <p className="mt-4 p-4 bg-primary/10 text-primary text-center text-sm rounded-lg border border-primary/20">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="mt-4 p-4 bg-destructive/10 text-destructive text-center text-sm rounded-lg border border-destructive/20">
                        {error}
                    </p>
                )}
            </form>
        </div>
    )
}
