import { AmazonPAAPI } from '@/lib/amazon-paapi';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asin = searchParams.get('asin');
  if (!asin) {
    return Response.json(
      { error: 'ASIN parameter is required' },
      { status: 400 }
    );
  }
  try {
    const product = await AmazonPAAPI.getProduct(asin);
    if (!product) {
      return Response.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    return Response.json({ product });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
