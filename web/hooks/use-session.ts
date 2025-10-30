import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';

import { useSupabase } from '@/components/providers/supabase-provider';

export function useSession() {
  const supabase = useSupabase();

  return useQuery<Session | null>({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      return data.session ?? null;
    },
  });
}
