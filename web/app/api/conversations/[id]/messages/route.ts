import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ChatRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(request);
    
    // Get conversation ID from params
    const { id } = await params;

    // Initialize repository
    const adminClient = createSupabaseAdminClient();
    const repository = new ChatRepository(adminClient);

    // Verify user owns the conversation
    const conversation = await repository.getConversation(id, user.id);
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages for the conversation
    const messages = await repository.getConversationMessages(id);

    // Get citations for each message
    const messagesWithCitations = await Promise.all(
      messages.map(async (message) => {
        const citations = await repository.getMessageCitations(message.id);
        return { ...message, citations };
      })
    );

    return NextResponse.json({
      conversation,
      messages: messagesWithCitations,
      count: messagesWithCitations.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch conversation messages' },
      { status: 500 }
    );
  }
}