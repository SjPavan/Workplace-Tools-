import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient(
      { cookies: () => cookieStore },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key-for-development-only',
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to get auth status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        created_at: session.user.created_at,
        last_sign_in_at: session.user.last_sign_in_at,
      } : null,
      session_expires_at: session?.expires_at || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}