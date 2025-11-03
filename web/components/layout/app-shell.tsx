'use client';

import type { ReactNode } from 'react';
import { useEffect, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';

import { logoutAction } from '@/app/actions/auth';
import ThemeToggle from '@/components/theme/theme-toggle';
import { useSession } from '@/hooks/use-session';
import { useAuthStore } from '@/store/auth-store';

interface AppShellProps {
  children: ReactNode;
  initialUser: User;
}

export function AppShell({ children, initialUser }: AppShellProps) {
  const [isPending, startTransition] = useTransition();
  const setUser = useAuthStore((state) => state.setUser);
  const { data: session } = useSession();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  const handleSignOut = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const email = session?.user?.email ?? initialUser.email;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-muted">Signed in as</p>
            <p className="font-semibold">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
            >
              {isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        {children}
      </main>
    </div>
  );
}
