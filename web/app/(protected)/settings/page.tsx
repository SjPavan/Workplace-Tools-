import type { Metadata } from 'next';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">Manage your account and application preferences.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Account Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <p className="mt-1 text-sm text-muted">{session?.user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">User ID</label>
              <p className="mt-1 text-xs font-mono text-muted">{session?.user.id}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted">
              Account settings and profile management features will be available in future updates.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Application Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted">Toggle between light and dark themes</p>
            </div>
            <p className="text-xs text-muted">Use theme toggle in header</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Notifications</p>
              <p className="text-xs text-muted">Manage notification preferences</p>
            </div>
            <p className="text-xs text-muted">Coming soon</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Language</p>
              <p className="text-xs text-muted">Choose your preferred language</p>
            </div>
            <p className="text-xs text-muted">English (default)</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Privacy & Security</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">Data Privacy</p>
            <p className="mt-1 text-xs text-muted">
              Your data is stored securely in Supabase with row-level security policies enabled.
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-foreground">Authentication</p>
            <p className="mt-1 text-xs text-muted">
              Your session is secured with JWT tokens and automatically expires after 24 hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}