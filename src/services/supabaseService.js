const { createClient } = require('@supabase/supabase-js');

let cachedClient = null;

function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL and key must be configured via environment variables.');
  }
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  return cachedClient;
}

function __setSupabaseClient(client) {
  cachedClient = client;
}

module.exports = {
  getSupabaseClient,
  __setSupabaseClient
};
