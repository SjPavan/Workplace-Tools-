'use client';

import { useState, type KeyboardEvent } from 'react';

import { useSupabase } from '@/components/providers/supabase-provider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const DEFAULT_API_URL = 'http://localhost:8000';

export default function AIChat() {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
      const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      const response = await fetch(`${normalizedApiUrl}/api/ai/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          model: 'gpt-3.5-turbo',
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { response?: string };
      const assistantResponse = data.response ?? 'No response returned by the AI assistant.';

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
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

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="border-b border-border bg-card/60 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">AI Assistant</h2>
          <p className="text-sm text-muted">Test the AI integration with mock responses.</p>
        </div>

        <div className="flex h-96 flex-col gap-4 overflow-y-auto bg-background/60 px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.timestamp.toISOString()}-${index}`} className="flex">
                <div
                  className={`max-w-xs rounded-xl px-4 py-2 text-sm shadow-sm ${
                    message.role === 'user'
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-border/40 text-foreground'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="mt-2 text-xs text-muted">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="rounded-xl bg-border/40 px-4 py-2 text-sm text-muted shadow-sm">
                Thinking...
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="border-t border-red-500/30 bg-red-500/10 px-6 py-3 text-sm text-red-500">
            Error: {error}
          </div>
        ) : null}

        <div className="border-t border-border bg-card/60 px-6 py-4">
          <div className="flex gap-3">
            <input
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
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>

        <div className="border-t border-border bg-card/60 px-6 py-3 text-right text-sm text-muted">
          <button
            type="button"
            onClick={handleAuth}
            className="font-medium text-primary transition hover:underline"
          >
            Test Supabase Authentication
          </button>
        </div>
      </div>
    </div>
  );
}
