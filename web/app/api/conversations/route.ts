import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ChatRepository } from '@/lib/db/repository';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(request);
    
    // Initialize repository
    const adminClient = createSupabaseAdminClient();
    const repository = new ChatRepository(adminClient);

    // Get conversations for the user
    const conversations = await repository.listConversations(user.id);

    return NextResponse.json({
      conversations,
      count: conversations.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error listing conversations:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticateRequest(request);
    
    // Parse request body
    const body = await request.json();
    const { title, model = 'gemini-1.5-flash', metadata } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Initialize repository
    const adminClient = createSupabaseAdminClient();
    const repository = new ChatRepository(adminClient);

    // Create new conversation
    const conversation = await repository.createConversation(
      user.id,
      title,
      model,
      metadata
    );

    return NextResponse.json({
      conversation,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}