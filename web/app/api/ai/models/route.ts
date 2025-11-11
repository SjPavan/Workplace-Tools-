import { NextResponse } from 'next/server';

export async function GET() {
  // Mock available AI models
  const models = [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient model for most tasks',
      maxTokens: 4096,
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most capable model for complex tasks',
      maxTokens: 8192,
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      description: 'Faster version of GPT-4 with larger context',
      maxTokens: 128000,
    },
  ];

  return NextResponse.json({
    models,
    default: 'gpt-3.5-turbo',
    timestamp: new Date().toISOString(),
  });
}