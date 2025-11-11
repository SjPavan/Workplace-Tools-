import type { Metadata } from 'next';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dashboard',
};

import AIChat from '@/components/AIChat';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">Welcome to your Workplace Tools dashboard.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">User Profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-muted">Email</p>
              <p className="text-sm text-foreground">{session?.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">User ID</p>
              <p className="text-xs text-foreground font-mono">{session?.user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted">Last Sign In</p>
              <p className="text-sm text-foreground">
                {session?.user.last_sign_in_at 
                  ? new Date(session.user.last_sign_in_at).toLocaleDateString()
                  : 'Unknown'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
          <div className="mt-4 space-y-3">
            <a 
              href="/analytics" 
              className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
            >
              📊 View Analytics
            </a>
            <a 
              href="/settings" 
              className="block w-full rounded-lg border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
            >
              ⚙️ Settings
            </a>
            <button className="w-full rounded-lg border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent">
              📝 Create New Project
            </button>
            <button 
              onClick={() => document.getElementById('ai-assistant')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
            >
              🤖 AI Assistant
            </button>
          </div>
        </div>
      </div>

      <div id="ai-assistant" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <p className="mt-2 text-sm text-muted">
          Get help with your workplace tasks using our AI-powered assistant.
        </p>
        <div className="mt-4">
          <AIChat />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">System Status</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-sm font-medium text-foreground">Authentication</p>
            <p className="text-xs text-muted">Connected</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-sm font-medium text-foreground">Database</p>
            <p className="text-xs text-muted">Ready</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✓</div>
            <p className="text-sm font-medium text-foreground">AI Service</p>
            <p className="text-xs text-muted">Available</p>
          </div>
        </div>
      </div>
    </section>
  );
}
