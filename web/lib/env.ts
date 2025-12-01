export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface ServiceConfig {
  geminiApiKey?: string;
  braveSearchApiKey?: string;
  supabaseServiceKey?: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  return { 
    supabaseUrl: supabaseUrl || 'https://demo.supabase.co',
    supabaseAnonKey: supabaseAnonKey || 'demo-key-for-development-only'
  };
}

export function getServiceConfig(): ServiceConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const braveSearchApiKey = process.env.BRAVE_SEARCH_API_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not configured. AI functionality will be limited.');
  }

  if (!braveSearchApiKey) {
    console.warn('BRAVE_SEARCH_API_KEY not configured. Search functionality will use mock results.');
  }

  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not configured. Admin operations will fail.');
  }

  return {
    geminiApiKey,
    braveSearchApiKey,
    supabaseServiceKey
  };
}
