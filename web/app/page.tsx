import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  redirect('/login');
}
