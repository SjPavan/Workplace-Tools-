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

    // Export the full conversation with research context
    const exportData = await repository.exportConversation(id);
    
    if (!exportData) {
      return NextResponse.json(
        { error: 'Failed to export conversation' },
        { status: 500 }
      );
    }

    // Check if client wants JSON or downloadable format
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    if (format === 'download') {
      // Create a text/markdown version for download
      const markdownContent = generateMarkdownExport(exportData);
      
      return new Response(markdownContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="conversation-${id}.md"`,
        },
      });
    }

    // Return JSON format by default
    return NextResponse.json({
      export: exportData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error exporting conversation:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    );
  }
}

function generateMarkdownExport(exportData: any): string {
  const { conversation, messages, research_entries } = exportData;
  
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Conversation ID:** ${conversation.id}\n`;
  markdown += `**Model:** ${conversation.model}\n`;
  markdown += `**Created:** ${new Date(conversation.created_at).toLocaleString()}\n`;
  markdown += `**Last Updated:** ${new Date(conversation.updated_at).toLocaleString()}\n\n`;
  
  if (research_entries.length > 0) {
    markdown += `## Research Context\n\n`;
    research_entries.forEach((entry: any, index: number) => {
      markdown += `### Search ${index + 1}: ${entry.query}\n`;
      markdown += `**Searched at:** ${new Date(entry.created_at).toLocaleString()}\n\n`;
      
      if (entry.results && Array.isArray(entry.results)) {
        entry.results.forEach((result: any) => {
          markdown += `- [${result.title}](${result.url})\n`;
          markdown += `  ${result.snippet || result.description}\n\n`;
        });
      }
    });
    markdown += `---\n\n`;
  }
  
  markdown += `## Conversation\n\n`;
  
  messages.forEach((message: any) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `### ${role}\n\n`;
    markdown += `${message.content}\n\n`;
    
    if (message.citations && message.citations.length > 0) {
      markdown += `**Sources:**\n`;
      message.citations.forEach((citation: any) => {
        markdown += `- [${citation.title}](${citation.url})\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `*${new Date(message.created_at).toLocaleString()}*\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
}