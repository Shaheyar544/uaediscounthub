export function validateEnv() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'DEEPSEEK_API_KEY'
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        const errorMsg = `❌ Missing Environment Variables: ${missing.join(', ')}. Check your .env file on Hostinger.`;
        console.error(errorMsg);
        // In production, we don't want to show the full error to users, but we need it in logs.
    }
}
