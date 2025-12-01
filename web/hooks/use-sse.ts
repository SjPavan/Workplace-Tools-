import { useCallback, useEffect, useRef, useState } from 'react';

interface SSEEvent {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  index?: number;
  model?: string;
  timestamp?: string;
  error?: string;
}

interface UseSSEOptions {
  onChunk?: (chunk: string) => void;
  onStart?: (model: string) => void;
  onEnd?: (model: string) => void;
  onError?: (error: string) => void;
  timeout?: number;
}

export function useSSE(options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    onChunk,
    onStart,
    onEnd,
    onError,
    timeout = 30000, // 30 seconds default timeout
  } = options;

  const connect = useCallback(async (url: string, payload: Record<string, unknown>) => {
    try {
      setError(null);
      setIsConnected(true);

      // Set timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        disconnect();
        setError('Request timeout');
        onError?.('Request timeout');
      }, timeout);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6);
              if (data.trim() === '') continue;
              
              const event: SSEEvent = JSON.parse(data);
              
              switch (event.type) {
                case 'start':
                  onStart?.(event.model || 'unknown');
                  break;
                case 'chunk':
                  onChunk?.(event.content || '');
                  break;
                case 'end':
                  onEnd?.(event.model || 'unknown');
                  disconnect();
                  break;
                case 'error':
                  const errorMsg = event.error || 'Unknown error';
                  setError(errorMsg);
                  onError?.(errorMsg);
                  disconnect();
                  break;
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsConnected(false);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [onChunk, onStart, onEnd, onError, timeout]);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    error,
  };
}