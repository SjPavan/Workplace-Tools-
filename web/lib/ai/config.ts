export interface AIConfig {
  geminiApiKey: string;
  geminiModelId: string;
  braveApiKey: string;
  searchEnabled: boolean;
  maxSearchResults: number;
  requestTimeout: number;
  rateLimitRpm: number;
}

export function getAIConfig(): AIConfig {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash';
  const braveApiKey = process.env.BRAVE_API_KEY;
  const searchEnabled = process.env.SEARCH_ENABLED !== 'false';
  const maxSearchResults = parseInt(process.env.MAX_SEARCH_RESULTS || '10', 10);
  const requestTimeout = parseInt(process.env.AI_REQUEST_TIMEOUT || '30000', 10);
  const rateLimitRpm = parseInt(process.env.AI_RATE_LIMIT_RPM || '60', 10);

  if (!geminiApiKey) {
    console.warn(
      'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.'
    );
  }

  if (searchEnabled && !braveApiKey) {
    console.warn(
      'Search is enabled but Brave API key not configured. Please set BRAVE_API_KEY in your environment variables or disable search with SEARCH_ENABLED=false.'
    );
  }

  return {
    geminiApiKey: geminiApiKey || 'demo-key-for-development-only',
    geminiModelId,
    braveApiKey: braveApiKey || 'demo-key-for-development-only',
    searchEnabled,
    maxSearchResults,
    requestTimeout,
    rateLimitRpm
  };
}