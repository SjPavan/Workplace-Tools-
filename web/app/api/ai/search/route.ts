import { NextRequest } from 'next/server';
import { BraveSearchClient } from '@/lib/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const searchClient = new BraveSearchClient();
    const results = await searchClient.search(query);

    return Response.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Search failed',
      results: [],
      query: query,
      searchTime: 0,
    }, { status: 500 });
  }
}