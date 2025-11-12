// API route for projects operations
import { NextRequest, NextResponse } from 'next/server';
import { createServerStorage } from '@/lib/database/server';

export async function GET(request: NextRequest) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc';
    const status = searchParams.get('status');
    const toolType = searchParams.get('toolType');

    const filters: Record<string, any> = {};
    if (status) filters.status = status;
    if (toolType) filters.tool_type = toolType;

    const options = {
      limit,
      offset,
      orderBy,
      orderDirection,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };

    const storage = await createServerStorage();
    const result = await storage.getProjects(session.user.id, options);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data: result.data,
      count: result.count,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { createSupabaseServerClient } = await import('@/lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, status, tool_type, data: projectData } = body;

    if (!name || !tool_type) {
      return NextResponse.json({ error: 'Name and tool_type are required' }, { status: 400 });
    }

    const projectDataInsert = {
      user_id: session.user.id,
      name,
      description,
      status: status || 'active',
      tool_type,
      data: projectData || null,
    };

    const storage = await createServerStorage();
    const result = await storage.createProject(projectDataInsert);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Projects POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}