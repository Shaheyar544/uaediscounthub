import { AmazonPAAPI } from '@/lib/amazon-paapi';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) {
    return Response.json(
      { error: 'Query parameter q is required' },
      { status: 400 }
    );
  }
  try {
    const products = await AmazonPAAPI.searchItems(query);
    return Response.json({ products });
  } catch (error: any) {
    console.error('Search Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
