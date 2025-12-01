import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ConversationWithMessages interface removed as it's not used

export function useConversations() {
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      return data.conversations as Conversation[];
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title?: string) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const data = await response.json();
      return data.conversation as Conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) => [
        newConversation,
        ...old,
      ]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) =>
        old.filter(conv => conv.id !== deletedId)
      );
      queryClient.removeQueries({ queryKey: ['conversation', deletedId] });
    },
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: createConversationMutation.mutateAsync,
    deleteConversation: deleteConversationMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
    isDeleting: deleteConversationMutation.isPending,
  };
}

export function useConversation(id: string) {
  const queryClient = useQueryClient();

  const {
    data: conversationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      const data = await response.json();
      return data as { conversation: Conversation; messages: Message[] };
    },
    enabled: !!id,
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ 
      role, 
      content, 
      metadata 
    }: { 
      role: 'user' | 'assistant' | 'system'; 
      content: string; 
      metadata?: Record<string, unknown>;
    }) => {
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role, content, metadata }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add message');
      }
      
      const data = await response.json();
      return data.message as Message;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(['conversation', id], (old: { messages: Message[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, newMessage],
        };
      });
      
      // Update the conversation's updated_at in the list
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) =>
        old.map(conv => 
          conv.id === id 
            ? { ...conv, updated_at: new Date().toISOString() }
            : conv
        )
      );
    },
  });

  return {
    conversation: conversationData?.conversation,
    messages: conversationData?.messages || [],
    isLoading,
    error,
    addMessage: addMessageMutation.mutateAsync,
    isAddingMessage: addMessageMutation.isPending,
  };
}

export function useExportConversation() {
  return {
    exportConversation: async (id: string) => {
      const response = await fetch(`/api/conversations/${id}/export`);
      if (!response.ok) {
        throw new Error('Failed to export conversation');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `conversation-${id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  };
}