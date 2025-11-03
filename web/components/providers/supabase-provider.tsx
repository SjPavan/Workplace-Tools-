'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAuthStore } from '@/store/auth-store';

const SupabaseContext = createContext<SupabaseClient | null>(null);

interface SupabaseProviderProps {
  children: ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [client] = useState(() => createSupabaseBrowserClient());
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isMounted = true;

    const syncSession = (session: Session | null) => {
      if (!isMounted) {
        return;
      }

      if (session?.user) {
        setUser(session.user);
      } else {
        clearUser();
      }

      queryClient.setQueryData(['auth', 'session'], session);
    };

    client.auth.getSession().then(({ data }) => {
      syncSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      syncSession(session ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, setUser, clearUser, queryClient]);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
}
