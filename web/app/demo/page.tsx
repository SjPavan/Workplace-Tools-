import AIChat from '@/components/AIChat'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Workplace Tools - Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the AI assistant and deployment infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
            <AIChat />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Frontend</h3>
                  <p className="text-sm text-gray-600">
                    Next.js with Supabase authentication
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Backend API</h3>
                  <p className="text-sm text-gray-600">
                    FastAPI with mock AI responses
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Database</h3>
                  <p className="text-sm text-gray-600">
                    Supabase PostgreSQL with RLS
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Deployment</h3>
                  <p className="text-sm text-gray-600">
                    Render (Backend) + Vercel (Frontend)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Health Check</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  GET /health
                </code>
              </div>
              
              <div>
                <h3 className="font-medium">AI Chat</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  POST /api/ai/complete
                </code>
              </div>
              
              <div>
                <h3 className="font-medium">AI Models</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  GET /api/ai/models
                </code>
              </div>
              
              <div>
                <h3 className="font-medium">Auth Status</h3>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  GET /auth/me
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}