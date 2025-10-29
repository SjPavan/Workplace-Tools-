import { getSupabaseClient } from '@/services/supabaseClient';
import { AuthUser } from '@/store/authStore';

export interface Credentials {
  email: string;
  password: string;
}

const buildMockUser = (email: string): AuthUser => ({
  id: `local-${email}`,
  email
});

export const signInWithEmail = async ({ email, password }: Credentials): Promise<AuthUser> => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return buildMockUser(email.toLowerCase());
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Unable to authenticate the user.');
  }

  return {
    id: data.user.id,
    email: data.user.email ?? email
  };
};
