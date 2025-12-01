import { NextResponse } from 'next/server';
import { createGeminiService } from '@/lib/services/gemini';

export async function GET() {
  try {
    const geminiService = createGeminiService();
    const models = geminiService.getAvailableModels();

    return NextResponse.json({
      models,
      default: 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    
    // Fallback to static models if service fails
    const fallbackModels = [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for most tasks',
        maxTokens: 1048576,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex tasks',
        maxTokens: 2097152,
      },
    ];

    return NextResponse.json({
      models: fallbackModels,
      default: 'gemini-1.5-flash',
      timestamp: new Date().toISOString(),
      error: 'Using fallback models due to service error'
    });
  }
}