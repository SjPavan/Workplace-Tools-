import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const aiApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const defaultAiApiUrl = 'http://localhost:8000';

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const aiApiConfigured = Boolean(aiApiUrl && aiApiUrl !== defaultAiApiUrl);

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: {
      name: 'Workplace Tools Web',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    },
    config: {
      supabaseConfigured,
      aiApiConfigured,
      aiApiUrl: aiApiUrl ?? defaultAiApiUrl,
      url: request.nextUrl.origin,
    },
  });
}
