import { GeminiClient, GeminiResponse } from './gemini';
import { BraveSearchClient, BraveSearchResponse } from '../search/brave';
import { getAIConfig } from './config';

export interface ResearchMetadata {
  searchPerformed: boolean;
  searchResults: BraveSearchResponse | null;
  query: string;
  model: string;
  responseTime: number;
  tokenCount?: number;
  finishReason?: string;
}

export interface ResearchStreamChunk {
  text: string;
  done: boolean;
  metadata?: ResearchMetadata;
}

export interface ResearchOptions {
  enableSearch?: boolean;
  maxSearchResults?: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export class ResearchService {
  private geminiClient: GeminiClient;
  private braveClient: BraveSearchClient;
  private config: ReturnType<typeof getAIConfig>;

  constructor() {
    this.config = getAIConfig();
    this.geminiClient = new GeminiClient();
    this.braveClient = new BraveSearchClient();
  }

  async *researchWithStreaming(
    query: string,
    options: ResearchOptions = {}
  ): AsyncIterableIterator<ResearchStreamChunk> {
    const startTime = Date.now();
    const enableSearch = options.enableSearch ?? this.config.searchEnabled;
    const maxSearchResults = options.maxSearchResults ?? this.config.maxSearchResults;

    let searchResponse: BraveSearchResponse | null = null;
    let searchError: Error | null = null;

    // Perform search if enabled
    if (enableSearch && this.config.searchEnabled) {
      try {
        searchResponse = await this.braveClient.search(query);
      } catch (error) {
        console.warn('Search failed:', error);
        searchError = error as Error;
        // Continue without search results rather than failing completely
      }
    }

    // Build prompt with search context if available
    const prompt = this.geminiClient.buildPromptWithContext(
      query,
      searchResponse?.results
    );

    // Generate AI response
    try {
      const geminiResponse: GeminiResponse = await this.geminiClient.generateContent(
        prompt,
        {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          topP: options.topP,
          topK: options.topK,
        }
      );

      const metadata: ResearchMetadata = {
        searchPerformed: enableSearch && this.config.searchEnabled,
        searchResults: searchResponse,
        query,
        model: geminiResponse.metadata.model,
        responseTime: Date.now() - startTime,
        finishReason: geminiResponse.metadata.finishReason,
      };

      // Stream the AI response
      let accumulatedText = '';
      for await (const chunk of geminiResponse.stream) {
        accumulatedText += chunk.text;
        
        yield {
          text: chunk.text,
          done: chunk.done,
          metadata: chunk.done ? metadata : undefined,
        };
      }
    } catch (error) {
      // If AI generation fails, still yield metadata about the search
      const metadata: ResearchMetadata = {
        searchPerformed: enableSearch && this.config.searchEnabled,
        searchResults: searchResponse,
        query,
        model: this.config.geminiModelId,
        responseTime: Date.now() - startTime,
        finishReason: 'ERROR',
      };

      yield {
        text: '',
        done: true,
        metadata,
      };

      throw error;
    }
  }

  async research(query: string, options: ResearchOptions = {}): Promise<{
    text: string;
    metadata: ResearchMetadata;
  }> {
    const chunks: ResearchStreamChunk[] = [];
    
    for await (const chunk of this.researchWithStreaming(query, options)) {
      chunks.push(chunk);
    }

    const text = chunks.map(chunk => chunk.text).join('');
    const metadata = chunks[chunks.length - 1]?.metadata;

    if (!metadata) {
      throw new Error('No metadata received from research service');
    }

    return { text, metadata };
  }

  // Utility method to enforce rate limiting
  private requestTimes: number[] = [];
  
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old request times
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
    
    // Check if we're at the rate limit
    if (this.requestTimes.length >= this.config.rateLimitRpm) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // Record this request
    this.requestTimes.push(now);
  }

  async researchWithRateLimit(
    query: string,
    options: ResearchOptions = {}
  ): Promise<AsyncIterableIterator<ResearchStreamChunk>> {
    await this.enforceRateLimit();
    return this.researchWithStreaming(query, options);
  }
}