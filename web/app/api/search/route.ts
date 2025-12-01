import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Mock Brave search results
    const mockSearchResults = [
      {
        id: '1',
        title: `Search result for: ${query}`,
        url: `https://example.com/search-result-1`,
        snippet: `This is a mock search result snippet for the query "${query}". In a production environment, this would connect to Brave Search API.`,
        publishedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: `Another result about ${query}`,
        url: `https://example.com/search-result-2`,
        snippet: `Another mock search result providing additional information about "${query}". This demonstrates how multiple results would be displayed.`,
        publishedDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: `Understanding ${query} better`,
        url: `https://example.com/search-result-3`,
        snippet: `A comprehensive resource explaining various aspects of "${query}" with detailed information and examples.`,
        publishedDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      },
    ].slice(0, limit);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      query,
      results: mockSearchResults,
      totalResults: mockSearchResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}