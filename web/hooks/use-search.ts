import { useMutation } from '@tanstack/react-query';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedDate: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  timestamp: string;
}

export function useSearch() {
  const {
    mutateAsync: search,
    isPending: isSearching,
    error,
  } = useMutation({
    mutationFn: async ({ query, limit = 5 }: { query: string; limit?: number }) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      return data as SearchResponse;
    },
  });

  return {
    search,
    isSearching,
    error,
  };
}