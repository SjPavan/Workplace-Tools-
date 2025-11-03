import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Test backend connectivity
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }

    const healthData = await response.json();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      backend: {
        url: backendUrl,
        status: 'connected',
        health: healthData,
      },
      frontend: {
        url: request.nextUrl.origin,
        status: 'healthy',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        frontend: {
          url: request.nextUrl.origin,
          status: 'healthy',
        },
      },
      { status: 500 }
    );
  }
}