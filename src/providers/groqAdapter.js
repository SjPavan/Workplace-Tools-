const axios = require('axios');
const AIModelAdapter = require('./baseAdapter');
const { ProviderError } = require('../util/errors');

class GroqAdapter extends AIModelAdapter {
  constructor(options = {}) {
    super({
      name: 'groq',
      model: options.model || 'llama3-70b-8192',
      cacheTtlSeconds: options.cacheTtlSeconds ?? 90,
      capabilities: {
        priorities: ['complexity', 'accuracy'],
        domains: ['analysis', 'reasoning']
      },
      httpClient: options.httpClient || axios
    });

    this.apiKey = options.apiKey || process.env.GROQ_API_KEY;
    this.baseUrl = options.baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generateCompletion({ prompt, messages = [], maxTokens = 2048, temperature = 0.3, systemPrompt }) {
    if (!prompt && (!Array.isArray(messages) || messages.length === 0)) {
      throw new ProviderError('Either prompt or messages must be provided for Groq completions', {
        providerName: this.name
      });
    }

    if (!this.apiKey) {
      throw new ProviderError('Missing Groq API key', {
        providerName: this.name
      });
    }

    const compiledMessages = Array.isArray(messages) && messages.length > 0
      ? messages
      : [{ role: 'user', content: prompt }];

    if (systemPrompt) {
      compiledMessages.unshift({ role: 'system', content: systemPrompt });
    }

    try {
      const response = await this.httpClient.post(
        this.baseUrl,
        {
          model: this.model,
          messages: compiledMessages,
          max_tokens: maxTokens,
          temperature
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data || {};
      const text = data.choices?.[0]?.message?.content?.trim?.() || '';

      return {
        text,
        raw: data
      };
    } catch (error) {
      const status = error.response?.status;
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;

      throw new ProviderError(error.response?.data?.error || error.message, {
        providerName: this.name,
        status,
        retryAfter,
        isRateLimit: status === 429,
        cause: error
      });
    }
  }
}

module.exports = GroqAdapter;
