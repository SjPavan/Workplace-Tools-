import { NextRequest, NextResponse } from 'next/server';
import { getMigrationStatus } from '@/lib/database/migrations';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const aiApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const defaultAiApiUrl = 'http://localhost:8000';

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://demo.supabase.co');
  const aiApiConfigured = Boolean(aiApiUrl && aiApiUrl !== defaultAiApiUrl);

  // Check storage layer status
  let storageStatus: { available: boolean; migrations: { applied: string[]; pending: string[]; total: number } } = { 
    available: false, 
    migrations: { applied: [], pending: [], total: 0 } 
  };
  if (supabaseConfigured) {
    try {
      const migrationStatus = await getMigrationStatus();
      storageStatus = { 
        available: true, 
        migrations: migrationStatus 
      };
    } catch (error) {
      console.warn('Storage health check failed:', error);
      storageStatus = { 
        available: false, 
        migrations: { applied: [], pending: [], total: 0 } 
      };
    }
  }

  // Test internal API endpoints
  const apiEndpoints = [
    { name: 'AI Models', path: '/api/ai/models' },
    { name: 'Auth Status', path: '/api/auth/me' },
  ];

  const endpointStatus = await Promise.allSettled(
    apiEndpoints.map(async (endpoint) => {
      try {
        const response = await fetch(new URL(endpoint.path, request.nextUrl.origin).toString());
        return {
          name: endpoint.name,
          path: endpoint.path,
          status: 'ok',
          statusCode: response.status,
        };
      } catch (error) {
        return {
          name: endpoint.name,
          path: endpoint.path,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    app: {
      name: 'Workplace Tools Web',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    config: {
      supabaseConfigured,
      aiApiConfigured,
      aiApiUrl: aiApiUrl ?? defaultAiApiUrl,
      url: request.nextUrl.origin,
    },
    endpoints: endpointStatus.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        name: 'Unknown', 
        path: 'Unknown', 
        status: 'error', 
        error: 'Promise rejected' 
      }
    ),
    features: {
      authentication: supabaseConfigured,
      storage: storageStatus.available,
      aiChat: true,
      themeToggle: true,
      serviceWorker: true,
    },
    storage: storageStatus,
  });
}
