import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { getSupabaseConfig } from '@/lib/env';

export function createSupabaseServerClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          (cookieStore as unknown as {
            set?: (options: { name: string; value: string } & CookieOptions) => void;
          }).set?.({ name, value, ...options });
        } catch {
          // Cookies are read-only in this environment. Ignore.
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          (cookieStore as unknown as {
            delete?: (name: string, options?: CookieOptions) => void;
            set?: (options: { name: string; value: string } & CookieOptions) => void;
          }).delete?.(name, options);
        } catch {
          try {
            (cookieStore as unknown as {
              set?: (options: { name: string; value: string } & CookieOptions) => void;
            }).set?.({ name, value: '', ...options, expires: new Date(0) });
          } catch {
            // Cookies are read-only in this environment. Ignore.
          }
        }
      },
    },
  }) as SupabaseClient;
}
