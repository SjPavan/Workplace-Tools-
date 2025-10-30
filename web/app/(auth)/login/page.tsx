import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import LoginForm from '@/components/auth/login-form';
import ThemeToggle from '@/components/theme/theme-toggle';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Access your account using Supabase authentication.',
};

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card/95 p-8 shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted">
            Sign in with your Supabase credentials to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
