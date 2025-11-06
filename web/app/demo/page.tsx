import AIChat from '@/components/AIChat';

export default function DemoPage() {
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <dl className="space-y-4 text-sm text-muted">
                <div>
                  <dt className="font-medium text-foreground">Frontend</dt>
                  <dd>Next.js with Supabase authentication scaffolded for rapid iteration.</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Backend API</dt>
                  <dd>FastAPI service returning mock AI responses for the chat surface.</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Database</dt>
                  <dd>Supabase PostgreSQL with row-level security policies enabled.</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Deployment</dt>
                  <dd>Render (Backend) + Vercel (Frontend) on free tier plans.</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">API Endpoints</h2>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Endpoint label="Health Check" method="GET" path="/health" />
              <Endpoint label="AI Chat" method="POST" path="/api/ai/complete" />
              <Endpoint label="AI Models" method="GET" path="/api/ai/models" />
              <Endpoint label="Auth Status" method="GET" path="/auth/me" />
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
