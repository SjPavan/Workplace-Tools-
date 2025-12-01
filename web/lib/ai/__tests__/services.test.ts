import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchService } from '../research';
import { GeminiClient } from '../gemini';
import { BraveSearchClient } from '../../search/brave';

// Mock the config to avoid needing real API keys
vi.mock('../config', () => ({
  getAIConfig: () => ({
    geminiApiKey: 'test-key',
    geminiModelId: 'gemini-1.5-flash',
    braveApiKey: 'test-key',
    searchEnabled: true,
    maxSearchResults: 10,
    requestTimeout: 30000,
    rateLimitRpm: 60,
  }),
}));

describe('ResearchService', () => {
  let researchService: ResearchService;

  beforeEach(() => {
    researchService = new ResearchService();
    vi.clearAllMocks();
  });

  it('should initialize without errors', () => {
    expect(researchService).toBeDefined();
  });

  it('should handle empty queries gracefully', async () => {
    const chunks = [];
    for await (const chunk of researchService.researchWithStreaming('')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should respect search disable option', async () => {
    const chunks = [];
    for await (const chunk of researchService.researchWithStreaming('test query', { enableSearch: false })) {
      chunks.push(chunk);
    }
    
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.metadata?.searchPerformed).toBe(false);
  });
});

describe('GeminiClient', () => {
  let geminiClient: GeminiClient;

  beforeEach(() => {
    geminiClient = new GeminiClient();
  });

  it('should initialize without errors', () => {
    expect(geminiClient).toBeDefined();
  });

  it('should build prompt with search context', () => {
    const searchResults = [
      {
        title: 'Test Title',
        url: 'https://example.com',
        snippet: 'Test snippet'
      }
    ];

    const prompt = geminiClient.buildPromptWithContext('What is test?', searchResults);
    
    expect(prompt).toContain('Context from web search');
    expect(prompt).toContain('Test Title');
    expect(prompt).toContain('What is test?');
  });

  it('should return original query when no search results', () => {
    const prompt = geminiClient.buildPromptWithContext('What is test?', []);
    expect(prompt).toBe('What is test?');
  });
});

describe('BraveSearchClient', () => {
  let searchClient: BraveSearchClient;

  beforeEach(() => {
    searchClient = new BraveSearchClient();
  });

  it('should initialize without errors', () => {
    expect(searchClient).toBeDefined();
  });
});