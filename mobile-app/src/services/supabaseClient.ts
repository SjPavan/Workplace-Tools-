import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

let client: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (client) {
    return client;
  }

  const expoConfig = Constants.expoConfig ?? Constants.manifest;
  const supabaseUrl = expoConfig?.extra?.supabaseUrl as string | undefined;
  const supabaseAnonKey = expoConfig?.extra?.supabaseAnonKey as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase credentials are not configured. Falling back to mock authentication.'
    );
    return null;
  }

  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return client;
};
