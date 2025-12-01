import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const body = await request.json();
    const { message, model = 'gpt-3.5-turbo', stream = false } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mockResponse = `I received your message: "${message}". This is a mock response from the ${model} model. In a production environment, this would connect to an actual AI service like OpenAI's API.`;

    if (stream) {
      // Create a readable stream for SSE
      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Send start event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'start',
              model,
              timestamp: new Date().toISOString(),
            })}\n\n`));

            // Simulate streaming response word by word
            const words = mockResponse.split(' ');
            
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
              
              // Send chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'chunk',
                content: chunk,
                index: i,
              })}\n\n`));

              // Simulate typing delay
              await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
            }

            // Send completion event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'end',
              model,
              timestamp: new Date().toISOString(),
            })}\n\n`));

            controller.close();
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Stream error',
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } else {
      // Non-streaming response for backward compatibility
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return new Response(JSON.stringify({
        response: mockResponse,
        model,
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('AI completion error:', error);
    
    if (request.headers.get('accept') === 'text/event-stream') {
      return new Response(
        `data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Failed to process AI request',
        })}\n\n`,
        {
          status: 500,
          headers: { 'Content-Type': 'text/event-stream' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to process AI request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}