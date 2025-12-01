// Re-export all AI and search utilities for easy importing
export { GeminiClient } from './gemini';
export { ResearchService } from './research';
export { getAIConfig } from './config';

// Re-export search client
export { BraveSearchClient } from '../search/brave';

// Export types
export type { 
  GeminiStreamChunk, 
  GeminiResponse 
} from './gemini';

export type { 
  BraveSearchResult, 
  BraveSearchResponse,
  BraveRawResult,
  BraveRawResponse
} from '../search/brave';

export type { 
  ResearchMetadata, 
  ResearchStreamChunk, 
  ResearchOptions 
} from './research';

export type { AIConfig } from './config';