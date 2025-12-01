export interface BraveSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  language?: string;
  relevanceScore?: number;
}

export interface BraveSearchResponse {
  results: BraveSearchResult[];
  totalResults?: number;
  query: string;
  searchTime: number;
}

export interface BraveRawResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
  meta?: {
    score?: number;
  };
}

export interface BraveRawResponse {
  web?: {
    results?: BraveRawResult[];
  };
  mixed?: {
    results?: BraveRawResult[];
  };
  query?: {
    search?: string;
  };
}

export class BraveSearchClient {
  private apiKey: string;
  private baseUrl: string;
  private maxResults: number;
  private requestTimeout: number;

  constructor() {
    const config = getAIConfig();
    this.apiKey = config.braveApiKey;
    this.baseUrl = 'https://api.search.brave.com/res/v1/web/search';
    this.maxResults = config.maxSearchResults;
    this.requestTimeout = config.requestTimeout;
  }

  async search(query: string): Promise<BraveSearchResponse> {
    if (!this.apiKey || this.apiKey === 'demo-key-for-development-only') {
      throw new Error('Brave Search API key not configured');
    }

    const startTime = Date.now();
    
    const url = new URL(this.baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('count', this.maxResults.toString());
    url.searchParams.set('text_decorations', 'false');
    url.searchParams.set('safesearch', 'moderate');
    url.searchParams.set('freshness', 'pd');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Brave Search API key');
        } else if (response.status === 429) {
          throw new Error('Brave Search API rate limit exceeded');
        } else {
          throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
        }
      }

      const rawResponse: BraveRawResponse = await response.json();
      const searchTime = Date.now() - startTime;

      return this.normalizeResponse(rawResponse, query, searchTime);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Search request timed out');
        }
        throw error;
      }
      
      throw new Error('Unknown search error occurred');
    }
  }

  private normalizeResponse(
    rawResponse: BraveRawResponse,
    query: string,
    searchTime: number
  ): BraveSearchResponse {
    const rawResults = [
      ...(rawResponse.web?.results || []),
      ...(rawResponse.mixed?.results || [])
    ];

    const results: BraveSearchResult[] = rawResults
      .slice(0, this.maxResults)
      .map((result): BraveSearchResult => ({
        title: result.title || '',
        url: result.url || '',
        snippet: result.description || '',
        publishedDate: this.parsePublishedDate(result.age),
        language: result.language,
        relevanceScore: result.meta?.score,
      }))
      .filter(result => result.title && result.url && result.snippet);

    return {
      results,
      totalResults: results.length,
      query: rawResponse.query?.search || query,
      searchTime,
    };
  }

  private parsePublishedDate(age?: string): string | undefined {
    if (!age) return undefined;

    // Parse various age formats from Brave Search
    // Examples: "2 days ago", "1 week ago", "3 months ago", "2023-12-01"
    const dateMatch = age.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      return dateMatch[0];
    }

    // For relative dates like "2 days ago", we could calculate the actual date
    // but for now, return the original string as it's still useful
    return age;
  }
}

// Import at the end to avoid circular dependency
import { getAIConfig } from '../ai/config';