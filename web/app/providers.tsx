'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';

import { SupabaseProvider } from '@/components/providers/supabase-provider';
import ServiceWorkerManager from '@/components/service-worker-manager';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>{children}</SupabaseProvider>
        <ServiceWorkerManager />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
