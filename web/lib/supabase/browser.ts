import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from '@/lib/env';
import type { Database } from './types';

export function createSupabaseBrowserClient(): SupabaseClient<Database> {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
