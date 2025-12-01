import { NextRequest } from 'next/server';
import { ResearchService } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, enableSearch, maxSearchResults, temperature, maxTokens } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const researchService = new ResearchService();
    const streamIterator = await researchService.researchWithRateLimit(query, {
      enableSearch,
      maxSearchResults,
      temperature,
      maxTokens,
    });

    // Create a readable stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamIterator) {
            const data = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            
            if (chunk.done) {
              controller.close();
            }
          }
        } catch (error) {
          const errorData = JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            done: true,
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}