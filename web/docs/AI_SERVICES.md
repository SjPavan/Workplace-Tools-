# AI Services Integration

This document describes the AI services integration that has been added to the Next.js application.

## Overview

The AI services integration provides a unified interface for:

1. **Google Gemini AI** - For generating text responses with streaming support
2. **Brave Search API** - For retrieving web search results to provide context
3. **Research Service** - Combines both services for AI-powered research with citations

## Architecture

### Core Components

#### `lib/ai/config.ts`
- Centralized configuration for all AI services
- Environment variable validation with fallbacks
- Rate limiting and timeout configurations

#### `lib/ai/gemini.ts`
- Wrapper around Google Generative AI SDK
- Streaming response support
- Prompt building with search context
- Error handling and timeout management

#### `lib/search/brave.ts`
- Brave Search API client
- Response normalization into citation-friendly format
- Rate limiting and error handling
- Configurable search parameters

#### `lib/ai/research.ts`
- Main service that combines Gemini and Brave Search
- Rate limiting enforcement
- Streaming research responses
- Structured metadata for downstream consumption

### API Routes

#### `POST /api/ai/research`
Main endpoint for AI-powered research with streaming responses.

**Request:**
```json
{
  "query": "What are the latest developments in quantum computing?",
  "enableSearch": true,
  "maxSearchResults": 10,
  "temperature": 0.7,
  "maxTokens": 2048
}
```

**Response:** Server-sent events (SSE) with streaming text and metadata.

#### `POST /api/ai/search`
Standalone search endpoint using Brave Search API.

**Request:**
```json
{
  "query": "quantum computing developments"
}
```

**Response:**
```json
{
  "results": [...],
  "totalResults": 10,
  "query": "quantum computing developments",
  "searchTime": 1250
}
```

#### `GET /api/ai/health`
Health check endpoint for AI services configuration.

## Environment Variables

Add these to your `.env.local` file:

```bash
# AI Services Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL_ID=gemini-1.5-flash
BRAVE_API_KEY=your-brave-search-api-key-here

# AI Service Options
SEARCH_ENABLED=true
MAX_SEARCH_RESULTS=10
AI_REQUEST_TIMEOUT=30000
AI_RATE_LIMIT_RPM=60
```

## Usage Examples

### Basic Research with Streaming

```typescript
import { ResearchService } from '@/lib/ai';

const researchService = new ResearchService();

for await (const chunk of researchService.researchWithStreaming(query)) {
  console.log(chunk.text);
  if (chunk.metadata) {
    console.log('Metadata:', chunk.metadata);
  }
}
```

### Direct Gemini Usage

```typescript
import { GeminiClient } from '@/lib/ai';

const geminiClient = new GeminiClient();
const response = await geminiClient.generateContent(prompt);

for await (const chunk of response.stream) {
  console.log(chunk.text);
}
```

### Direct Search Usage

```typescript
import { BraveSearchClient } from '@/lib/search';

const searchClient = new BraveSearchClient();
const results = await searchClient.search(query);
console.log(results.results);
```

## Features

### Rate Limiting
- Built-in rate limiting for Gemini API (configurable RPM)
- Automatic request queuing when limits are reached

### Error Handling
- Graceful degradation when search fails
- Timeout protection for all API calls
- Detailed error messages for debugging

### Response Normalization
- Consistent data structures across services
- Citation-friendly search result format
- Structured metadata for research results

### Streaming Support
- Real-time response streaming for better UX
- Server-sent events for web integration
- Progressive content delivery

## Demo Page

A demo page is available at `/demo/ai-research` to test the integration with:
- Interactive query input
- Configurable parameters (temperature, tokens, search)
- Real-time streaming display
- Search results visualization
- Response metadata display

## Security Considerations

- API keys are server-side only
- Input validation on all endpoints
- Rate limiting prevents abuse
- Timeout protection against hanging requests
- Demo fallback values for development

## Performance Optimizations

- Connection pooling for API calls
- Configurable timeouts
- Efficient streaming implementation
- Minimal memory footprint for large responses
- Lazy loading of service clients

## Extensibility

The architecture is designed to be easily extended with:
- Additional AI providers (OpenAI, Anthropic, etc.)
- More search engines
- Custom prompt templates
- Additional response formats
- Enhanced rate limiting strategies