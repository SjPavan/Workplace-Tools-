const AIOrchestrator = require('../src/orchestration/orchestrator');
const AIModelAdapter = require('../src/providers/baseAdapter');
const MemoryCache = require('../src/cache/memoryCache');
const { createSafetyFilter } = require('../src/safety/filters');
const { ProviderError } = require('../src/util/errors');

function createMockAdapter(name, { response, streamChunks, matches = true, capabilities } = {}) {
  const adapter = new AIModelAdapter({
    name,
    model: `${name}-model`,
    capabilities
  });

  adapter.matchesCapabilities = jest.fn(() => matches);
  adapter.generateCompletion = jest.fn().mockResolvedValue(response || { text: `${name} completion`, raw: { provider: name } });
  adapter.streamCompletion = jest.fn(async function* () {
    const chunks = streamChunks || [
      { event: 'chunk', text: `${name} chunk` },
      { event: 'end', raw: { provider: name } }
    ];
    for (const chunk of chunks) {
      yield chunk;
    }
  });

  return adapter;
}

function createOrchestrator(overrides = {}) {
  const providers = overrides.providers || {
    gemini: createMockAdapter('gemini'),
    huggingface: createMockAdapter('huggingface'),
    groq: createMockAdapter('groq'),
    local: createMockAdapter('local')
  };

  return new AIOrchestrator({
    providers,
    cache: overrides.cache || new MemoryCache({ defaultTtlSeconds: 60 }),
    safetyFilter: overrides.safetyFilter || createSafetyFilter()
  });
}

describe('AIOrchestrator', () => {
  it('routes multimodal requests to the Gemini provider', async () => {
    const gemini = createMockAdapter('gemini');
    const orchestrator = createOrchestrator({
      providers: {
        gemini,
        huggingface: createMockAdapter('huggingface'),
        groq: createMockAdapter('groq'),
        local: createMockAdapter('local')
      }
    });

    await orchestrator.complete({
      prompt: 'Describe this picture',
      multimodalInputs: [{ type: 'image', data: 'base64' }]
    });

    expect(gemini.generateCompletion).toHaveBeenCalledTimes(1);
  });

  it('routes code requests to the HuggingFace provider', async () => {
    const huggingface = createMockAdapter('huggingface');
    const orchestrator = createOrchestrator({
      providers: {
        gemini: createMockAdapter('gemini'),
        huggingface,
        groq: createMockAdapter('groq'),
        local: createMockAdapter('local')
      }
    });

    await orchestrator.complete({
      prompt: 'function add(a, b) { return a + b; }',
      domain: 'code'
    });

    expect(huggingface.generateCompletion).toHaveBeenCalledTimes(1);
  });

  it('caches identical requests', async () => {
    const huggingface = createMockAdapter('huggingface', {
      response: { text: 'first result', raw: { provider: 'huggingface' } }
    });

    const cache = new MemoryCache({ defaultTtlSeconds: 60 });
    const orchestrator = createOrchestrator({
      providers: {
        gemini: createMockAdapter('gemini'),
        huggingface,
        groq: createMockAdapter('groq'),
        local: createMockAdapter('local')
      },
      cache
    });

    const request = { prompt: 'Write a function to sum numbers', domain: 'code' };

    const first = await orchestrator.complete(request);
    const second = await orchestrator.complete(request);

    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(huggingface.generateCompletion).toHaveBeenCalledTimes(1);
  });

  it('streams responses and persists them in cache', async () => {
    const streamChunks = [
      { event: 'chunk', text: 'Hello' },
      { event: 'chunk', text: ' world' },
      { event: 'end', raw: { provider: 'local' } }
    ];
    const local = createMockAdapter('local', { streamChunks });
    const cache = new MemoryCache({ defaultTtlSeconds: 60 });

    const orchestrator = createOrchestrator({
      providers: {
        gemini: createMockAdapter('gemini'),
        huggingface: createMockAdapter('huggingface'),
        groq: createMockAdapter('groq'),
        local
      },
      cache
    });

    const request = { prompt: 'Quick reply', priority: 'latency' };
    const received = [];

    for await (const chunk of orchestrator.streamComplete(request)) {
      received.push(chunk);
    }

    expect(received.filter((chunk) => chunk.event === 'chunk').length).toBe(2);
    expect(cache.size()).toBeGreaterThan(0);

    const cached = [];
    for await (const chunk of orchestrator.streamComplete(request)) {
      cached.push(chunk);
    }

    expect(cached[0].event).toBe('cache');
    expect(cached[1].event).toBe('chunk');
  });

  it('falls back to the next provider on rate limit errors', async () => {
    const rateLimited = createMockAdapter('groq');
    rateLimited.generateCompletion.mockImplementation(() => {
      const error = new ProviderError('Rate limited', {
        providerName: 'groq',
        isRateLimit: true
      });
      throw error;
    });

    const fallback = createMockAdapter('huggingface');
    const orchestrator = createOrchestrator({
      providers: {
        gemini: createMockAdapter('gemini'),
        huggingface: fallback,
        groq: rateLimited,
        local: createMockAdapter('local')
      }
    });

    await orchestrator.complete({
      prompt: 'Explain the quicksort algorithm in detail',
      complexity: 'high'
    });

    expect(rateLimited.generateCompletion).toHaveBeenCalledTimes(1);
    expect(fallback.generateCompletion).toHaveBeenCalledTimes(1);
  });
});
