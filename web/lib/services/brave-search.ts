interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  snippet?: string;
}

interface BraveSearchResponse {
  web?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      snippet?: string;
    }>;
  };
}

export class BraveSearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.BRAVE_SEARCH_API_KEY || '';
    if (!this.apiKey) {
      console.warn('BRAVE_SEARCH_API_KEY not configured, search functionality will be limited');
    }
  }

  async search(query: string, count: number = 10): Promise<BraveSearchResult[]> {
    if (!this.apiKey) {
      // Return mock results if API key is not configured
      return this.getMockResults(query);
    }

    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
      }

      const data: BraveSearchResponse = await response.json();
      
      return (data.web?.results || []).map(result => ({
        title: result.title,
        url: result.url,
        description: result.description,
        snippet: result.snippet || result.description.substring(0, 200) + '...'
      }));
    } catch (error) {
      console.error('Brave Search error:', error);
      // Fallback to mock results on error
      return this.getMockResults(query);
    }
  }

  private getMockResults(query: string): BraveSearchResult[] {
    return [
      {
        title: `Search results for "${query}" - Mock Result 1`,
        url: 'https://example.com/mock1',
        description: 'This is a mock search result for demonstration purposes when Brave Search API is not configured.',
        snippet: 'Mock snippet showing relevant information about the search query.'
      },
      {
        title: `Information about "${query}" - Mock Result 2`,
        url: 'https://example.com/mock2',
        description: 'Another mock search result that would normally contain real information from the web.',
        snippet: 'Additional mock content that simulates what a real search result might contain.'
      }
    ];
  }
}