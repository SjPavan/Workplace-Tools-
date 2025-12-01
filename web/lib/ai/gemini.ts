import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from './config';

export interface GeminiStreamChunk {
  text: string;
  done: boolean;
}

export interface GeminiResponse {
  stream: AsyncIterableIterator<GeminiStreamChunk>;
  metadata: {
    model: string;
    finishReason?: string;
    totalTokens?: number;
  };
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private config: ReturnType<typeof getAIConfig>;

  constructor() {
    this.config = getAIConfig();
    this.genAI = new GoogleGenerativeAI(this.config.geminiApiKey);
  }

  async generateContent(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    } = {}
  ): Promise<GeminiResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.config.geminiModelId,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.8,
        topK: options.topK ?? 40,
      },
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.config.requestTimeout);
    });

    try {
      const result = await Promise.race([
        model.generateContentStream(prompt),
        timeoutPromise
      ]) as any;

      const stream = this.createStreamIterator(result.stream);
      
      return {
        stream,
        metadata: {
          model: this.config.geminiModelId,
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        throw new Error('AI request timed out');
      }
      throw error;
    }
  }

  private async *createStreamIterator(
    stream: any
  ): AsyncIterableIterator<GeminiStreamChunk> {
    try {
      for await (const chunk of stream) {
        const text = chunk.text();
        if (text) {
          yield {
            text,
            done: false
          };
        }
      }
    } catch (error) {
      console.error('Error in Gemini stream:', error);
      throw error;
    } finally {
      yield {
        text: '',
        done: true
      };
    }
  }

  buildPromptWithContext(
    userQuery: string,
    searchResults?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>
  ): string {
    if (!searchResults || searchResults.length === 0) {
      return userQuery;
    }

    const context = searchResults
      .map((result, index) => 
        `[${index + 1}] Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`
      )
      .join('\n\n');

    return `Context from web search:\n${context}\n\nBased on the above context and your knowledge, please respond to the following query:\n\n${userQuery}\n\nPlease provide a comprehensive answer and cite your sources using the reference numbers [1], [2], etc. when relevant.`;
  }
}