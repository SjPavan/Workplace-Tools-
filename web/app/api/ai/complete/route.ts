import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, model = 'gpt-3.5-turbo' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock AI response
    const mockResponse = `I received your message: "${message}". This is a mock response from the ${model} model. In a production environment, this would connect to an actual AI service like OpenAI's API.`;

    return NextResponse.json({
      response: mockResponse,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI completion error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}