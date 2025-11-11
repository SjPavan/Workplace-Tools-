'use client';

import { useEffect, useState } from 'react';
import AIChat from '@/components/AIChat';

interface HealthStatus {
  status: string;
  timestamp: string;
  responseTime: string;
  app: {
    name: string;
    version: string;
    environment: string;
    nodeVersion: string;
  };
  config: {
    supabaseConfigured: boolean;
    aiApiConfigured: boolean;
    aiApiUrl: string;
    url: string;
  };
  endpoints: Array<{
    name: string;
    path: string;
    status: string;
    statusCode?: number;
    error?: string;
  }>;
  features: {
    authentication: boolean;
    aiChat: boolean;
    themeToggle: boolean;
    serviceWorker: boolean;
  };
}

export default function DemoPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthStatus(data);
      } catch (error) {
        console.error('Failed to fetch health status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-5xl space-y-10 px-4">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-foreground">Workplace Tools – Demo</h1>
          <p className="mt-3 text-base text-muted">
            Experiment with the AI assistant and review the deployment surface area.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">AI Assistant</h2>
            <AIChat />
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">System Status</h2>
            {isLoading ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ) : healthStatus ? (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Overall Status</span>
                    <span className={`text-sm font-medium ${
                      healthStatus.status === 'ok' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {healthStatus.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-foreground">Response Time:</span>
                      <span className="ml-2 text-muted">{healthStatus.responseTime}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Environment:</span>
                      <span className="ml-2 text-muted">{healthStatus.app.environment}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Version:</span>
                      <span className="ml-2 text-muted">{healthStatus.app.version}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Node.js:</span>
                      <span className="ml-2 text-muted">{healthStatus.app.nodeVersion}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Features</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={healthStatus.features.authentication ? 'text-green-600' : 'text-red-600'}>
                          {healthStatus.features.authentication ? '✓' : '✗'}
                        </span>
                        <span className="text-muted">Authentication</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={healthStatus.features.aiChat ? 'text-green-600' : 'text-red-600'}>
                          {healthStatus.features.aiChat ? '✓' : '✗'}
                        </span>
                        <span className="text-muted">AI Chat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={healthStatus.features.themeToggle ? 'text-green-600' : 'text-red-600'}>
                          {healthStatus.features.themeToggle ? '✓' : '✗'}
                        </span>
                        <span className="text-muted">Theme Toggle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={healthStatus.features.serviceWorker ? 'text-green-600' : 'text-red-600'}>
                          {healthStatus.features.serviceWorker ? '✓' : '✗'}
                        </span>
                        <span className="text-muted">Service Worker</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">API Endpoints</h4>
                    <div className="space-y-1">
                      {healthStatus.endpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-muted">{endpoint.name}</span>
                          <span className={
                            endpoint.status === 'ok' ? 'text-green-600' : 'text-red-600'
                          }>
                            {endpoint.status === 'ok' ? '✓' : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-red-600">Failed to load system status</p>
              </div>
            )}
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">API Endpoints</h2>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Endpoint label="Health Check" method="GET" path="/api/health" />
              <Endpoint label="AI Chat" method="POST" path="/api/ai/complete" />
              <Endpoint label="AI Models" method="GET" path="/api/ai/models" />
              <Endpoint label="Auth Status" method="GET" path="/api/auth/me" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface EndpointProps {
  label: string;
  method: string;
  path: string;
}

function Endpoint({ label, method, path }: EndpointProps) {
  return (
    <div className="space-y-1 text-sm">
      <h3 className="font-medium text-foreground">{label}</h3>
      <code className="inline-block rounded-md border border-border bg-background/80 px-3 py-1 font-mono text-xs text-muted">
        {method} {path}
      </code>
    </div>
  );
}
