import type { Metadata } from 'next';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Analytics',
};

export default async function AnalyticsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Mock analytics data
  const analyticsData = {
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 5432,
    avgSessionDuration: '12m 34s',
    topFeatures: [
      { name: 'AI Assistant', usage: 3421, percentage: 63 },
      { name: 'Dashboard', usage: 2876, percentage: 53 },
      { name: 'Settings', usage: 1234, percentage: 23 },
    ],
    weeklyActivity: [
      { day: 'Mon', users: 234, sessions: 892 },
      { day: 'Tue', users: 267, sessions: 1024 },
      { day: 'Wed', users: 298, sessions: 1145 },
      { day: 'Thu', users: 312, sessions: 1203 },
      { day: 'Fri', users: 289, sessions: 1098 },
      { day: 'Sat', users: 156, sessions: 623 },
      { day: 'Sun', users: 134, sessions: 512 },
    ],
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted">Monitor your application usage and performance metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.totalUsers.toLocaleString()}</p>
            </div>
            <div className="text-2xl">👥</div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Active Users</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.activeUsers.toLocaleString()}</p>
            </div>
            <div className="text-2xl">🟢</div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Total Sessions</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.totalSessions.toLocaleString()}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Avg Session</p>
              <p className="text-2xl font-bold text-foreground">{analyticsData.avgSessionDuration}</p>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Top Features</h2>
          <div className="mt-4 space-y-3">
            {analyticsData.topFeatures.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{feature.name}</span>
                  <span className="text-muted">{feature.usage.toLocaleString()} uses</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${feature.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Weekly Activity</h2>
          <div className="mt-4 space-y-3">
            {analyticsData.weeklyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground w-8">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(day.sessions / 1203) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted w-12 text-right">{day.sessions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">System Performance</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">99.9%</div>
            <p className="text-sm font-medium text-foreground">Uptime</p>
            <p className="text-xs text-muted">Last 30 days</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">142ms</div>
            <p className="text-sm font-medium text-foreground">Avg Response</p>
            <p className="text-xs text-muted">API latency</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0.02%</div>
            <p className="text-sm font-medium text-foreground">Error Rate</p>
            <p className="text-xs text-muted">Last 7 days</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">User Information</h2>
        <p className="mt-2 text-sm text-muted">
          Analytics data shown here is for demonstration purposes. In a production environment, 
          this would display real usage metrics and user behavior analytics.
        </p>
        <p className="mt-2 text-xs text-muted">
          Current user: {session?.user.email} | User ID: {session?.user.id}
        </p>
      </div>
    </section>
  );
}