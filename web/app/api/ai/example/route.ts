import { NextRequest, NextResponse } from 'next/server';
import { ResearchService, GeminiClient, BraveSearchClient } from '@/lib/ai';

// Example integration showing different ways to use the AI services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, mode = 'research' } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    switch (mode) {
      case 'research': {
        // Full research with search + AI
        const researchService = new ResearchService();
        const result = await researchService.research(query, {
          enableSearch: true,
          maxSearchResults: 5,
          temperature: 0.7,
        });
        
        return NextResponse.json({
          mode: 'research',
          result: result.text,
          metadata: result.metadata,
        });
      }

      case 'ai-only': {
        // AI without search
        const researchService = new ResearchService();
        const result = await researchService.research(query, {
          enableSearch: false,
          temperature: 0.8,
        });
        
        return NextResponse.json({
          mode: 'ai-only',
          result: result.text,
          metadata: result.metadata,
        });
      }

      case 'search-only': {
        // Search only, no AI
        const searchClient = new BraveSearchClient();
        const searchResults = await searchClient.search(query);
        
        return NextResponse.json({
          mode: 'search-only',
          results: searchResults.results,
          metadata: {
            totalResults: searchResults.totalResults,
            searchTime: searchResults.searchTime,
            query: searchResults.query,
          },
        });
      }

      case 'custom-prompt': {
        // Custom prompt with manual search context
        const searchClient = new BraveSearchClient();
        const searchResults = await searchClient.search(query);
        
        const geminiClient = new GeminiClient();
        const prompt = geminiClient.buildPromptWithContext(
          `Provide a detailed analysis of: ${query}`,
          searchResults.results
        );
        
        const response = await geminiClient.generateContent(prompt, {
          temperature: 0.5,
          maxTokens: 1024,
        });
        
        let text = '';
        for await (const chunk of response.stream) {
          text += chunk.text;
        }
        
        return NextResponse.json({
          mode: 'custom-prompt',
          result: text,
          metadata: {
            model: response.metadata.model,
            searchResults: searchResults.results.length,
            customPrompt: true,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI integration example error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET endpoint to show available modes
export async function GET() {
  return NextResponse.json({
    modes: [
      {
        name: 'research',
        description: 'Full research with web search + AI analysis',
        uses: ['Brave Search', 'Gemini AI'],
      },
      {
        name: 'ai-only',
        description: 'AI response without web search',
        uses: ['Gemini AI'],
      },
      {
        name: 'search-only',
        description: 'Web search results only',
        uses: ['Brave Search'],
      },
      {
        name: 'custom-prompt',
        description: 'Custom prompt with search context',
        uses: ['Brave Search', 'Gemini AI', 'Custom prompting'],
      },
    ],
    examples: {
      research: {
        query: 'What are the latest developments in quantum computing?',
        mode: 'research',
      },
      'ai-only': {
        query: 'Explain the concept of machine learning',
        mode: 'ai-only',
      },
      'search-only': {
        query: 'quantum computing breakthroughs 2024',
        mode: 'search-only',
      },
      'custom-prompt': {
        query: 'Analyze the impact of AI on healthcare',
        mode: 'custom-prompt',
      },
    },
  });
}