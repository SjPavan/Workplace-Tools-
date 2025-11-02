const axios = require('axios');
const AIModelAdapter = require('./baseAdapter');
const { ProviderError } = require('../util/errors');

class GeminiAdapter extends AIModelAdapter {
  constructor(options = {}) {
    super({
      name: 'gemini',
      model: options.model || 'gemini-1.5-flash',
      cacheTtlSeconds: options.cacheTtlSeconds ?? 60,
      capabilities: {
        modalities: ['multimodal', 'vision', 'text'],
        priorities: ['breadth']
      },
      httpClient: options.httpClient || axios
    });

    this.apiKey = options.apiKey || process.env.GOOGLE_API_KEY;
    this.baseUrl = options.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
  }

  buildParts({ prompt, multimodalInputs = [] }) {
    const parts = [];

    if (prompt) {
      parts.push({ text: prompt });
    }

    for (const item of multimodalInputs) {
      if (!item) {
        continue;
      }

      if (item.type === 'image' && item.data) {
        parts.push({
          inline_data: {
            mime_type: item.mimeType || 'image/png',
            data: item.data
          }
        });
      } else if (item.type === 'text') {
        parts.push({ text: item.content || '' });
      }
    }

    return parts;
  }

  async generateCompletion({ prompt, multimodalInputs = [], temperature = 0.4, maxTokens = 1024 }) {
    if (!prompt && multimodalInputs.length === 0) {
      throw new ProviderError('Gemini requests require a prompt or multimodal input', {
        providerName: this.name
      });
    }

    if (!this.apiKey) {
      throw new ProviderError('Missing Google API key for Gemini provider', {
        providerName: this.name
      });
    }

    const parts = this.buildParts({ prompt, multimodalInputs });

    try {
      const response = await this.httpClient.post(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts
            }
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data || {};
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .join(' ')
        .trim() || '';

      return {
        text,
        raw: data
      };
    } catch (error) {
      const status = error.response?.status;
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;

      throw new ProviderError(error.response?.data?.error?.message || error.message, {
        providerName: this.name,
        status,
        retryAfter,
        isRateLimit: status === 429,
        cause: error
      });
    }
  }
}

module.exports = GeminiAdapter;
