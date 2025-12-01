'use client';

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, Download, Info, MessageSquare, Search, Send, User, X } from 'lucide-react';

import { useSupabase } from '@/components/providers/supabase-provider';
import { useConversations, useConversation, useExportConversation } from '@/hooks/use-conversations';
import { useSearch } from '@/hooks/use-search';
import { useSSE } from '@/hooks/use-sse';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedDate: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    searchResults?: SearchResult[];
    citations?: SearchResult[];
  };
}

const DEFAULT_API_URL = 'http://localhost:8000';

export default function AIChat() {
  const supabase = useSupabase();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showResearchMetadata, setShowResearchMetadata] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResult[]>([]);

  const { data: authState } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    },
  });
  
  const user = authState?.data.session?.user;

  const {
    conversations,
    createConversation,
    deleteConversation,
    isCreating,
    isDeleting,
  } = useConversations();

  const {
    conversation,
    addMessage,
  } = useConversation(selectedConversationId || '');

  const { exportConversation } = useExportConversation();
  const { search, isSearching, error: searchError } = useSearch();
  const { connect, error: sseError } = useSSE({
    onChunk: (chunk) => {
      setStreamingContent(prev => prev + chunk);
    },
    onStart: () => {
      setStreamingContent('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);
    },
    onEnd: async () => {
      const assistantMessage = streamingContent;
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = assistantMessage;
          newMessages[newMessages.length - 1].metadata = {
            searchResults: currentSearchResults,
          };
        }
        return newMessages;
      });

      // Save to database
      if (selectedConversationId && assistantMessage) {
        await addMessage({
          role: 'assistant',
          content: assistantMessage,
          metadata: {
            searchResults: currentSearchResults,
          },
        });
      }

      setStreamingContent('');
      setIsLoading(false);
      setCurrentSearchResults([]);
    },
    onError: (errorMsg) => {
      setError(errorMsg);
      setIsLoading(false);
      setStreamingContent('');
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (conversation) {
      const conversationMessages = conversation.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata,
      }));
      setMessages(conversationMessages);
    }
  }, [conversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    // Create new conversation if none selected
    let conversationId = selectedConversationId;
    if (!conversationId) {
      const newConversation = await createConversation(
        trimmedInput.length > 50 ? trimmedInput.substring(0, 50) + '...' : trimmedInput
      );
      conversationId = newConversation.id;
      setSelectedConversationId(conversationId);
    }

    const userMessage: Message = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to database
      await addMessage({
        role: 'user',
        content: trimmedInput,
      });

      // Perform search for context
      const searchResults = await search({ query: trimmedInput, limit: 3 });
      setCurrentSearchResults(searchResults.results);

      // Start SSE stream
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
      const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      await connect(`${normalizedApiUrl}/api/ai/complete`, {
        message: trimmedInput,
        model: 'gpt-3.5-turbo',
        conversationId,
        searchResults: searchResults.results,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleAuth = async () => {
    try {
      setError(null);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleExportConversation = async () => {
    if (!selectedConversationId) return;
    
    try {
      await exportConversation(selectedConversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const startNewConversation = async () => {
    const newConversation = await createConversation('New Conversation');
    setSelectedConversationId(newConversation.id);
    setMessages([]);
    setInput('');
    setError(null);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Conversation History */}
      <div className="w-80 border-r border-border bg-card/60">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
          <button
            onClick={startNewConversation}
            disabled={isCreating}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            New
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex cursor-pointer items-center justify-between border-b border-border p-4 hover:bg-card/80 transition-colors ${
                  selectedConversationId === conv.id ? 'bg-card/80' : ''
                }`}
                onClick={() => setSelectedConversationId(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {conv.title}
                  </h3>
                  <p className="text-xs text-muted">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteConversation(conv.id);
                  }}
                  disabled={isDeleting}
                  className="ml-2 rounded p-1 text-muted hover:text-destructive transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border bg-card/60 px-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
            <p className="text-sm text-muted">
              {selectedConversationId ? conversation?.title || 'Loading...' : 'Select or create a conversation'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidePanel(!showSidePanel)}
              className="rounded-lg p-2 text-muted hover:bg-card/80 transition-colors"
              title="Toggle research panel"
            >
              <Search className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleExportConversation}
              disabled={!selectedConversationId}
              className="rounded-lg p-2 text-muted hover:bg-card/80 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              title="Export conversation"
            >
              <Download className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowResearchMetadata(!showResearchMetadata)}
              className="rounded-lg p-2 text-muted hover:bg-card/80 transition-colors"
              title="Toggle metadata"
            >
              <Info className="h-4 w-4" />
            </button>
            
            {user ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <User className="h-4 w-4" />
                {user.email}
              </div>
            ) : (
              <button
                onClick={handleAuth}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-background/60 px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted mb-4" />
                <p className="text-sm text-muted">Start a conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.timestamp.toISOString()}-${index}`} className="mb-4">
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-xl px-4 py-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-border/40 text-foreground'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {showResearchMetadata && message.metadata?.searchResults && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <p className="text-xs font-medium mb-2">Sources:</p>
                        <div className="space-y-1">
                          {message.metadata.searchResults.map((result, i) => (
                            <div key={i} className="text-xs opacity-75">
                              • {result.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="mt-2 text-xs opacity-75">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Streaming message */}
          {streamingContent && (
            <div className="flex justify-start mb-4">
              <div className="max-w-2xl rounded-xl bg-border/40 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4" />
                  <span className="text-xs font-medium">Assistant</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {streamingContent}
                </p>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex justify-start mb-4">
              <div className="rounded-xl bg-border/40 px-4 py-2 text-sm text-muted shadow-sm">
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {error && (
          <div className="border-t border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-500">
            Error: {error}
          </div>
        )}
        
        {sseError && (
          <div className="border-t border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-500">
            Stream Error: {sseError}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border bg-card/60 px-6 py-4">
          {isSearching && (
            <div className="mb-2 text-sm text-muted">
              Searching...
            </div>
          )}
          
          {searchError && (
            <div className="mb-2 text-sm text-red-500">
              Search failed: {searchError instanceof Error ? searchError.message : 'Unknown error'}
            </div>
          )}
          
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => {
                void sendMessage();
              }}
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side Panel - Search Results */}
      {showSidePanel && (
        <div className="w-80 border-l border-border bg-card/60">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <h3 className="text-sm font-semibold text-foreground">Research</h3>
            <button
              onClick={() => setShowSidePanel(false)}
              className="rounded p-1 text-muted hover:bg-card/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-4rem)] p-4">
            {currentSearchResults.length === 0 ? (
              <p className="text-sm text-muted">Search results will appear here</p>
            ) : (
              <div className="space-y-4">
                {currentSearchResults.map((result) => (
                  <div key={result.id} className="border-b border-border pb-3">
                    <h4 className="text-sm font-medium text-foreground mb-1">
                      {result.title}
                    </h4>
                    <p className="text-xs text-muted mb-2">
                      {result.snippet}
                    </p>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {result.url}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}