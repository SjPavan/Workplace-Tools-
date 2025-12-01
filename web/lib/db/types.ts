// Database types for chat functionality
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
          model: string;
          metadata?: Record<string, any>;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
          model: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          model?: string;
          metadata?: Record<string, any>;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          metadata?: Record<string, any>;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
          metadata?: Record<string, any>;
        };
      };
      citations: {
        Row: {
          id: string;
          message_id: string;
          title: string;
          url: string;
          snippet?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          title: string;
          url: string;
          snippet?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          title?: string;
          url?: string;
          snippet?: string;
          created_at?: string;
        };
      };
      research_entries: {
        Row: {
          id: string;
          conversation_id: string;
          query: string;
          results: any; // JSON data from search API
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          query: string;
          results: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          query?: string;
          results?: any;
          created_at?: string;
        };
      };
    };
  };
}

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Citation = Database['public']['Tables']['citations']['Row'];
export type ResearchEntry = Database['public']['Tables']['research_entries']['Row'];

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  model?: string;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  stream: ReadableStream<Uint8Array>;
}

export interface ConversationExport {
  conversation: Conversation;
  messages: (Message & {
    citations?: Citation[];
  })[];
  research_entries: ResearchEntry[];
}