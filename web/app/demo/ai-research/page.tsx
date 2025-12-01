'use client';

import { useState } from 'react';

export default function AIResearchDemo() {
  const [query, setQuery] = useState('What are the latest developments in quantum computing?');
  const [response, setResponse] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [enableSearch, setEnableSearch] = useState(true);

  const handleResearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    setMetadata(null);

    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          temperature,
          maxTokens,
          enableSearch,
        }),
      });

      if (!response.ok) {
        throw new Error('Research request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.text) {
                  accumulatedText += data.text;
                  setResponse(accumulatedText);
                }

                if (data.metadata) {
                  setMetadata(data.metadata);
                }
              } catch (e) {
                // Ignore JSON parsing errors for partial chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Research error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Research Demo</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-2">
            Research Query:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="temperature" className="block text-sm font-medium mb-2">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              id="temperature"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="maxTokens" className="block text-sm font-medium mb-2">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              id="maxTokens"
              min="100"
              max="4096"
              step="100"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableSearch"
            checked={enableSearch}
            onChange={(e) => setEnableSearch(e.target.checked)}
            className="mr-2"
            disabled={loading}
          />
          <label htmlFor="enableSearch" className="text-sm font-medium">
            Enable web search
          </label>
        </div>

        <button
          onClick={handleResearch}
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Researching...' : 'Research'}
        </button>
      </div>

      {response && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Response:</h2>
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
              {response}
            </div>
          </div>

          {metadata && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Metadata:</h3>
              <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                <div><strong>Model:</strong> {metadata.model}</div>
                <div><strong>Search Performed:</strong> {metadata.searchPerformed ? 'Yes' : 'No'}</div>
                <div><strong>Response Time:</strong> {metadata.responseTime}ms</div>
                <div><strong>Finish Reason:</strong> {metadata.finishReason}</div>
                {metadata.searchResults && (
                  <div><strong>Search Results:</strong> {metadata.searchResults.results.length}</div>
                )}
              </div>
            </div>
          )}

          {metadata?.searchResults?.results && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
              <div className="space-y-3">
                {metadata.searchResults.results.map((result: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{result.title}</h4>
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {result.url}
                    </a>
                    <p className="text-gray-600 mt-1">{result.snippet}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}