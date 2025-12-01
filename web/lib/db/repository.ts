import { SupabaseClient } from '@supabase/supabase-js';
import { 
  Conversation, 
  Message, 
  Citation, 
  ResearchEntry,
  ConversationExport 
} from './types';

export class ChatRepository {
  constructor(private supabase: SupabaseClient) {}

  // Conversation operations
  async createConversation(
    userId: string,
    title: string,
    model: string,
    metadata?: Record<string, any>
  ): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        model,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversations')
      .update({ 
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Message operations
  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateMessage(
    messageId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .update({
        content,
        metadata: metadata || {}
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Citation operations
  async createCitations(
    messageId: string,
    citations: Array<{
      title: string;
      url: string;
      snippet?: string;
    }>
  ): Promise<Citation[]> {
    const citationsWithMessageId = citations.map(citation => ({
      message_id: messageId,
      ...citation
    }));

    const { data, error } = await this.supabase
      .from('citations')
      .insert(citationsWithMessageId)
      .select();

    if (error) throw error;
    return data || [];
  }

  async getMessageCitations(messageId: string): Promise<Citation[]> {
    const { data, error } = await this.supabase
      .from('citations')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Research operations
  async createResearchEntry(
    conversationId: string,
    query: string,
    results: any
  ): Promise<ResearchEntry> {
    const { data, error } = await this.supabase
      .from('research_entries')
      .insert({
        conversation_id: conversationId,
        query,
        results
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConversationResearch(conversationId: string): Promise<ResearchEntry[]> {
    const { data, error } = await this.supabase
      .from('research_entries')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Export operations
  async exportConversation(conversationId: string): Promise<ConversationExport | null> {
    const { data: conversation, error: convError } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;
    if (!conversation) return null;

    const [messages, researchEntries] = await Promise.all([
      this.getConversationMessages(conversationId),
      this.getConversationResearch(conversationId)
    ]);

    // Get citations for each message
    const messagesWithCitations = await Promise.all(
      messages.map(async (message) => {
        const citations = await this.getMessageCitations(message.id);
        return { ...message, citations };
      })
    );

    return {
      conversation,
      messages: messagesWithCitations,
      research_entries: researchEntries
    };
  }
}