/**
 * Amazon Creators API (OAuth 2.0) Implementation
 * Targeted for: UAE Marketplace (amazon.ae)
 * Version: v3 LwA (Login with Amazon) Flow
 * Architecture: PA API 5.0 via Creators OAuth
 */

export interface AmazonProduct {
    asin: string;
    title: string;
    imageUrl: string;
    price: number;
    originalPrice?: number;
    currency: string;
    url: string;
    savings?: number;
    discountPercent?: number;
}

interface AmazonToken {
    access_token: string;
    expires_in: number;
    token_type: string;
    expires_at: number;
}

// In-memory token cache
let cachedToken: AmazonToken | null = null;

// CIRCUIT BREAKER: Toggle this to false to re-enable Amazon automation
const AMAZON_MANUAL_MODE = process.env.AMAZON_MANUAL_MODE !== 'false';

export class AmazonCreatorsAPI {
    // Confirmed working token endpoint
    private static readonly TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
    // Regional host for Amazon Creators API
    private static readonly API_BASE_URL = 'https://creatorsapi.amazon/catalog/v1';
    private static readonly MARKETPLACE = 'www.amazon.ae';
    private static readonly SCOPE = 'creatorsapi::default';

    /**
     * Circuit Breaker Check
     */
    public static isManualMode(): boolean {
        return AMAZON_MANUAL_MODE;
    }

    /**
     * Fetches a fresh OAuth 2.0 token using LwA v3 Flow
     */
    private static async getAccessToken(): Promise<string> {
        if (AMAZON_MANUAL_MODE) return '';
        
        if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
            return cachedToken.access_token;
        }

        const credentialId = process.env.AMAZON_CREATOR_CREDENTIAL_ID;
        const credentialSecret = process.env.AMAZON_CREATOR_CREDENTIAL_SECRET;

        if (!credentialId || !credentialSecret) {
            throw new Error(
                'Amazon Creator credentials (AMAZON_CREATOR_CREDENTIAL_ID, ' +
                'AMAZON_CREATOR_CREDENTIAL_SECRET) are not configured.'
            );
        }

        const tokenResponse = await fetch(this.TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: credentialId,
                client_secret: credentialSecret,
                scope: this.SCOPE
            }).toString()
        });

        const rawText = await tokenResponse.text();

        if (!tokenResponse.ok) {
            console.error('[Amazon OAuth Error]:', rawText);
            throw new Error(`[Amazon OAuth] Failed to fetch token: ${tokenResponse.status}`);
        }

        const tokenData = JSON.parse(rawText);

        cachedToken = {
            ...tokenData,
            expires_at: Date.now() + tokenData.expires_in * 1000
        };

        return cachedToken!.access_token;
    }

    /**
     * Internal caller with token management and specific Creators API headers
     */
    private static async request(operation: string, body: any) {
        const token = await this.getAccessToken();
        
        // Operation determines the target header and path
        const endpoint = `/${operation}`;
        const url = `${this.API_BASE_URL}${endpoint}`;
        
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=utf-8',
            'x-marketplace': this.MARKETPLACE
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        
        console.log(`[Amazon API] ${operation} - Status:`, response.status);

        if (responseText.trim().startsWith('<')) {
            throw new Error(`Amazon API returned HTML (status ${response.status}).`);
        }

        const data = JSON.parse(responseText);

        if (!response.ok) {
            console.error('=== AMAZON API ERROR ===');
            console.error('Status:', response.status);
            console.error('Full error body:', JSON.stringify(data, null, 2));
            throw new Error(data.errors?.[0]?.message || `Amazon API Error (${response.status})`);
        }

        return data;
    }

    /**
     * Search products by keyword
     */
    public static async searchItems(keywords: string): Promise<AmazonProduct[]> {
        if (AMAZON_MANUAL_MODE) return [];
        
        const partnerTag = process.env.AMAZON_PARTNER_TAG;
        
        const payload = {
            keywords: keywords.trim(),
            partnerTag: partnerTag,
            partnerType: 'Associates',
            searchIndex: 'All',
            marketplace: this.MARKETPLACE,
            resources: [
                'itemInfo.title',
                'images.primary.medium',
                'offersV2.listings.price'
            ]
        };

        const data = await this.request('searchItems', payload);
        return this.transformResults(data.searchResult?.items || []);
    }

    /**
     * Fetch specific product data by ASIN
     */
    public static async getProduct(asin: string): Promise<AmazonProduct | null> {
        if (AMAZON_MANUAL_MODE) return null;
        
        const partnerTag = process.env.AMAZON_PARTNER_TAG;
        
        const payload = {
            itemIds: [asin],
            itemIdType: 'ASIN',
            partnerTag: partnerTag,
            partnerType: 'Associates',
            marketplace: this.MARKETPLACE,
            resources: [
                'itemInfo.title',
                'images.primary.medium',
                'offersV2.listings.price'
            ]
        };

        const data = await this.request('getItems', payload);
        const items = this.transformResults(data.itemsResult?.items || []);
        return items.length > 0 ? items[0] : null;
    }

    /**
     * Fetch multiple product details by their ASINs (max 10)
     */
    public static async getProducts(asins: string[]): Promise<AmazonProduct[]> {
        if (AMAZON_MANUAL_MODE || asins.length === 0) return [];
        
        const partnerTag = process.env.AMAZON_PARTNER_TAG;
        
        const payload = {
            itemIds: asins.slice(0, 10),
            itemIdType: 'ASIN',
            partnerTag: partnerTag,
            partnerType: 'Associates',
            marketplace: this.MARKETPLACE,
            resources: [
                'itemInfo.title',
                'images.primary.medium',
                'offersV2.listings.price'
            ]
        };

        const data = await this.request('getItems', payload);
        return this.transformResults(data.itemsResult?.items || []);
    }

    private static transformResults(items: any[]): AmazonProduct[] {
        return items.map(item => {
            const priceInfo = item.offersV2?.listings?.[0]?.price;
            return {
                asin: item.asin,
                title: item.itemInfo?.title?.displayValue || 'Amazon Product',
                imageUrl: item.images?.primary?.medium?.url || '',
                price: priceInfo?.money?.amount || 0,
                currency: priceInfo?.money?.currency || 'AED',
                url: item.detailPageURL || `https://www.amazon.ae/dp/${item.asin}?tag=${process.env.AMAZON_PARTNER_TAG}`,
                savings: priceInfo?.savings?.money?.amount || priceInfo?.savings?.amount,
                discountPercent: priceInfo?.savings?.percentage
            };
        });
    }
}
