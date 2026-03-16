export function validateEnv() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'CLOUDFLARE_ACCOUNT_ID',
        'CLOUDFLARE_R2_ACCESS_KEY',
        'CLOUDFLARE_R2_SECRET_KEY',
        'R2_BUCKET_NAME',
        'NEXT_PUBLIC_MEDIA_URL',
        // 'AMAZON_CREATOR_CREDENTIAL_ID',
        // 'AMAZON_CREATOR_CREDENTIAL_SECRET',
        'AMAZON_PARTNER_TAG'
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        const errorMsg = `❌ Missing Environment Variables: ${missing.join(', ')}. Check your .env file on Hostinger or .env.local locally.`;
        console.error(errorMsg);
        // In production, we don't want to show the full error to users, but we need it in logs.
    }
}
