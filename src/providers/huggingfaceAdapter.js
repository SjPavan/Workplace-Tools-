const axios = require('axios');
const AIModelAdapter = require('./baseAdapter');
const { ProviderError } = require('../util/errors');

class HuggingFaceAdapter extends AIModelAdapter {
  constructor(options = {}) {
    super({
      name: 'huggingface',
      model: options.model || 'codellama/CodeLlama-7b-Instruct-hf',
      cacheTtlSeconds: options.cacheTtlSeconds ?? 180,
      capabilities: {
        domains: ['code', 'analysis'],
        priorities: ['accuracy']
      },
      httpClient: options.httpClient || axios
    });

    this.apiKey = options.apiKey || process.env.HF_API_TOKEN;
    this.baseUrl = options.baseUrl || 'https://api-inference.huggingface.co/models';
  }

  async generateCompletion({ prompt, temperature = 0.2, maxTokens = 1024 }) {
    if (!prompt) {
      throw new ProviderError('Prompt is required for HuggingFace completion', {
        providerName: this.name
      });
    }

    if (!this.apiKey) {
      throw new ProviderError('Missing HuggingFace API token', {
        providerName: this.name
      });
    }

    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            temperature,
            max_new_tokens: maxTokens
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data || {};
      let text = '';

      if (Array.isArray(data) && data.length > 0) {
        text = data[0]?.generated_text || data[0]?.translation_text || '';
      } else if (typeof data === 'object') {
        text = data.generated_text || data.text || '';
      } else {
        text = String(data);
      }

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

module.exports = HuggingFaceAdapter;
