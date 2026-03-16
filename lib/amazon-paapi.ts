import crypto from 'crypto';

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

export class AmazonPAAPI {
  private static readonly HOST = 'webservices.amazon.ae';
  private static readonly REGION = 'eu-west-1';
  private static readonly SERVICE = 'ProductAdvertisingAPI';
  private static readonly MARKETPLACE = 'www.amazon.ae';

  private static sign(key: Buffer, msg: string): Buffer {
    return crypto
      .createHmac('sha256', key)
      .update(msg, 'utf8')
      .digest();
  }

  private static getSigningKey(
    secret: string,
    date: string,
    region: string,
    service: string
  ): Buffer {
    const kSecret  = Buffer.from('AWS4' + secret, 'utf8');
    const kDate    = this.sign(kSecret, date);
    const kRegion  = this.sign(kDate, region);
    const kService = this.sign(kRegion, service);
    const kSigning = this.sign(kService, 'aws4_request');
    return kSigning;
  }

  private static async call(
    path: string,
    target: string,
    payload: object
  ): Promise<any> {
    const accessKey = process.env.AMAZON_ACCESS_KEY;
    const secretKey = process.env.AMAZON_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error('AMAZON_ACCESS_KEY or AMAZON_SECRET_KEY not configured');
    }

    const body = JSON.stringify(payload);
    
    const now = new Date();
    // YYYYMMDDTHHmmssZ format
    const amzDate = now.toISOString()
      .replace(/[:-]|\.\d{3}/g, '')
      .substring(0, 13) + '00Z'; 
    const dateStamp = amzDate.substring(0, 8);

    // Exact content type used in PA-API
    const contentType = 'application/json; charset=utf-8';
    const contentEncoding = 'amz-1.0';

    // Hash the payload
    const payloadHash = crypto
      .createHash('sha256')
      .update(body, 'utf8')
      .digest('hex');

    // Canonical headers MUST be alphabetically sorted, lowercase
    const canonicalHeaders = 
      'content-encoding:' + contentEncoding + '\n' +
      'content-type:' + contentType + '\n' +
      'host:' + this.HOST + '\n' +
      'x-amz-date:' + amzDate + '\n' +
      'x-amz-target:' + target + '\n';

    const signedHeaders = 
      'content-encoding;content-type;host;x-amz-date;x-amz-target';

    // Canonical request
    const canonicalUri = path;
    const canonicalQueryString = '';
    
    const canonicalRequest = [
      'POST',
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    // Credential scope
    const credentialScope = [
      dateStamp,
      this.REGION,
      this.SERVICE,
      'aws4_request'
    ].join('/');

    // String to sign
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256')
        .update(canonicalRequest, 'utf8')
        .digest('hex')
    ].join('\n');

    // Signing key
    const signingKey = this.getSigningKey(
      secretKey, dateStamp, this.REGION, this.SERVICE
    );

    // Signature
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign, 'utf8')
      .digest('hex');

    // Authorization header
    const authorization =
      'AWS4-HMAC-SHA256 ' +
      'Credential=' + accessKey + '/' + credentialScope + ', ' +
      'SignedHeaders=' + signedHeaders + ', ' +
      'Signature=' + signature;

    // Debug logging
    console.log('[PA-API] Date:', amzDate);
    console.log('[PA-API] Target:', target);
    console.log('[PA-API] Credential scope:', credentialScope);

    const response = await fetch(
      `https://${this.HOST}${path}`,
      {
        method: 'POST',
        headers: {
          'content-encoding': contentEncoding,
          'content-type': contentType,
          'host': this.HOST,
          'x-amz-date': amzDate,
          'x-amz-target': target,
          'authorization': authorization
        },
        body
      }
    );

    const text = await response.text();
    console.log('[PA-API] Status:', response.status);
    console.log('[PA-API] Preview:', text.substring(0, 300));

    const data = JSON.parse(text);

    if (!response.ok) {
      console.error('[PA-API] Full error:', JSON.stringify(data, null, 2));
      throw new Error(
        data.Errors?.[0]?.Message ||
        data.__type ||
        `PA-API Error (${response.status})`
      );
    }

    return data;
  }

  public static async searchItems(
    keywords: string
  ): Promise<AmazonProduct[]> {
    const data = await this.call(
      '/paapi5/searchitems',
      'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      {
        Keywords: keywords.trim(),
        PartnerTag: process.env.AMAZON_PARTNER_TAG,
        PartnerType: 'Associates',
        SearchIndex: 'All',
        Marketplace: this.MARKETPLACE,
        Resources: [
          'ItemInfo.Title',
          'Images.Primary.Medium',
          'OffersV2.Listings.Price',
          'DetailPageURL'
        ]
      }
    );
    return this.transform(data.SearchResult?.Items || []);
  }

  public static async getProduct(
    asin: string
  ): Promise<AmazonProduct | null> {
    const data = await this.call(
      '/paapi5/getitems',
      'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
      {
        ItemIds: [asin],
        PartnerTag: process.env.AMAZON_PARTNER_TAG,
        PartnerType: 'Associates',
        Marketplace: this.MARKETPLACE,
        Resources: [
          'ItemInfo.Title',
          'Images.Primary.Medium',
          'OffersV2.Listings.Price',
          'DetailPageURL'
        ]
      }
    );
    const items = this.transform(data.ItemsResult?.Items || []);
    return items[0] || null;
  }

  private static transform(items: any[]): AmazonProduct[] {
    return items.map(item => {
      const price = item.OffersV2?.Listings?.[0]?.Price;
      return {
        asin: item.ASIN,
        title: item.ItemInfo?.Title?.DisplayValue || 'Amazon Product',
        imageUrl: item.Images?.Primary?.Medium?.URL || '',
        price: price?.Amount || 0,
        currency: price?.Currency || 'AED',
        url: item.DetailPageURL ||
          `https://www.amazon.ae/dp/${item.ASIN}` +
          `?tag=${process.env.AMAZON_PARTNER_TAG}`,
        savings: price?.Savings?.Amount,
        discountPercent: price?.Savings?.Percentage
      };
    });
  }
}
