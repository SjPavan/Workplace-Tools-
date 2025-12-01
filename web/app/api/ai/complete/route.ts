import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ChatRepository } from '@/lib/db/repository';
import { BraveSearchService } from '@/lib/services/brave-search';
import { createGeminiService } from '@/lib/services/gemini';
import { ChatRequest } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(request);
    
    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, conversation_id, model = 'gemini-1.5-flash' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const adminClient = createSupabaseAdminClient();
    const repository = new ChatRepository(adminClient);
    const searchService = new BraveSearchService();
    const geminiService = createGeminiService();

    let conversationId = conversation_id;
    let conversation;

    // Create or get conversation
    if (conversationId) {
      conversation = await repository.getConversation(conversationId, user.id);
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }
    } else {
      // Create new conversation with title from first message
      const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
      conversation = await repository.createConversation(
        user.id,
        title,
        model
      );
      conversationId = conversation.id;
    }

    // Create user message
    const userMessage = await repository.createMessage(
      conversationId,
      'user',
      message
    );

    // Perform web search for context
    const searchResults = await searchService.search(message, 5);
    
    // Save research entry
    if (searchResults.length > 0) {
      await repository.createResearchEntry(
        conversationId,
        message,
        searchResults
      );
    }

    // Create assistant message (will be updated as we stream)
    const assistantMessage = await repository.createMessage(
      conversationId,
      'assistant',
      '',
      { model, status: 'streaming' }
    );

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection event
        controller.enqueue(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));
        
        try {
          let fullResponse = '';
          const citations: Array<{ title: string; url: string; snippet?: string }> = [];

          for await (const chunk of geminiService.streamCompletion(prompt, {
            model,
            systemInstruction
          })) {
            fullResponse += chunk;
            
            // Send chunk to client
            const eventData = `event: message\ndata: ${JSON.stringify({
              chunk,
              message_id: assistantMessage.id,
              conversation_id: conversationId
            })}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          }

          // Extract citations from search results that were referenced
          for (const result of searchResults) {
            if (fullResponse.includes(result.url) || fullResponse.includes(result.title)) {
              citations.push({
                title: result.title,
                url: result.url,
                snippet: result.snippet
              });
            }
          }

          // Update the assistant message with full content
          await repository.updateMessage(
            assistantMessage.id,
            fullResponse,
            { model, status: 'completed', citations: citations.length }
          );

          // Save citations if any
          if (citations.length > 0) {
            await repository.createCitations(assistantMessage.id, citations);
          }

          // Send completion event
          const completionData = `event: complete\ndata: ${JSON.stringify({
            message_id: assistantMessage.id,
            conversation_id: conversationId,
            citations
          })}\n\n`;
          controller.enqueue(encoder.encode(completionData));

          // Close the stream
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          
          // Update message with error status
          await repository.updateMessage(
            assistantMessage.id,
            'Sorry, I encountered an error while generating a response.',
            { model, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          );

          // Send error event
          const errorData = `event: error\ndata: ${JSON.stringify({
            message_id: assistantMessage.id,
            conversation_id: conversationId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));

          controller.close();
        }
      }
    });
    
    // Build context for Gemini
    const searchContext = searchResults.map(result => 
      `Source: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}\n`
    ).join('\n');

    const systemInstruction = `You are a helpful AI assistant with access to web search results. 
    Use the provided search results to give accurate, up-to-date information. 
    Always cite your sources using the format [Source Title](URL) when referencing information from the search results.
    If the search results don't contain relevant information, say so and provide your general knowledge.`;

    const prompt = `User message: ${message}

Search results:
${searchContext}

Please provide a helpful response based on the user's message and the search results above.`;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat completion error:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}