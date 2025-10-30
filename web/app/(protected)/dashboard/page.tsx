import type { Metadata } from 'next';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">An authenticated area of the application.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Welcome</h2>
        <p className="mt-2 text-sm text-muted">
          You are signed in as <span className="font-medium text-foreground">{session?.user.email}</span>.
        </p>
        <p className="mt-4 text-sm text-muted">
          This protected space is ready for your application content. Update this area to surface
          data from your Supabase project using TanStack Query or server components.
        </p>
      </div>
    </section>
  );
}
