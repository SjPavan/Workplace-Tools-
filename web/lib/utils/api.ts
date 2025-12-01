import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function authenticateRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  // Get the user from the session
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized: No valid session found');
  }
  
  return user;
}

export function createSSEStream() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));
    }
  });
  
  return { stream, encoder };
}

export function sendSSEEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: any
) {
  const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(eventData));
}