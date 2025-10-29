const axios = require('axios');
const AIModelAdapter = require('./baseAdapter');
const { ProviderError } = require('../util/errors');

class LocalLlamaAdapter extends AIModelAdapter {
  constructor(options = {}) {
    super({
      name: 'local-phi3',
      model: options.model || 'phi-3-mini-4k-instruct-q4_0',
      cacheTtlSeconds: options.cacheTtlSeconds ?? 45,
      capabilities: {
        priorities: ['latency'],
        domains: ['assistant', 'general'],
        modalities: ['text']
      },
      httpClient: options.httpClient || axios
    });

    this.baseUrl = options.baseUrl || process.env.LOCAL_LLAMA_BASE_URL || 'http://localhost:8080';
    this.timeout = options.timeout || 10_000;
  }

  async generateCompletion({ prompt, temperature = 0.2, maxTokens = 512 }) {
    if (!prompt) {
      throw new ProviderError('Prompt is required for local llama.cpp completion', {
        providerName: this.name
      });
    }

    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/completion`,
        {
          prompt,
          temperature,
          n_predict: maxTokens
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );

      const data = response.data || {};
      const text = data.content || data.text || data.completion || '';

      return {
        text,
        raw: data
      };
    } catch (error) {
      const status = error.response?.status;
      throw new ProviderError(error.response?.data?.error || error.message, {
        providerName: this.name,
        status,
        isRateLimit: status === 429,
        cause: error
      });
    }
  }

  async *streamCompletion(payload) {
    const { text, raw } = await this.generateCompletion(payload);
    const segments = text.split(/(\.|!|\?)/).filter(Boolean);

    for (const segment of segments) {
      const chunk = segment.trim();
      if (!chunk) {
        continue;
      }
      yield { event: 'chunk', text: chunk };
    }

    yield { event: 'end', raw };
  }
}

module.exports = LocalLlamaAdapter;
