// API route for database migrations
import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, getMigrationStatus } from '@/lib/database/migrations';

// Only allow in development or with admin key
function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.MIGRATION_ADMIN_KEY;
  
  return authHeader === `Bearer ${adminKey}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getMigrationStatus();
    return NextResponse.json({ 
      status: 'ok',
      migrationStatus: status
    });
  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runMigrations();
    
    const allSuccessful = results.every(r => r.success);
    
    return NextResponse.json({ 
      status: allSuccessful ? 'ok' : 'partial',
      results
    }, { status: allSuccessful ? 200 : 207 });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}