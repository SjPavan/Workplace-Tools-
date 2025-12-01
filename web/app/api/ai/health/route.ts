import { NextRequest } from 'next/server';
import { ResearchService, BraveSearchClient, GeminiClient } from '@/lib/ai';

// Simple health check for AI services
export async function GET() {
  try {
    const config = {
      geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'demo-key-for-development-only',
      braveConfigured: !!process.env.BRAVE_API_KEY && process.env.BRAVE_API_KEY !== 'demo-key-for-development-only',
      searchEnabled: process.env.SEARCH_ENABLED !== 'false',
      geminiModel: process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash',
    };

    // Test basic service instantiation
    const researchService = new ResearchService();
    const geminiClient = new GeminiClient();
    const searchClient = new BraveSearchClient();

    return Response.json({
      status: 'healthy',
      services: {
        research: 'initialized',
        gemini: 'initialized',
        search: 'initialized',
      },
      config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI health check error:', error);
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}