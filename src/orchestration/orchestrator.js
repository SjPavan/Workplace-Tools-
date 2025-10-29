const crypto = require('crypto');
const { ProviderError, SafetyError } = require('../util/errors');

class AIOrchestrator {
  constructor({ providers, cache, safetyFilter } = {}) {
    if (!providers || Object.keys(providers).length === 0) {
      throw new Error('At least one provider must be supplied to the AI orchestrator');
    }

    this.providers = providers;
    this.cache = cache;
    this.safetyFilter = safetyFilter;
  }

  _orderedProvidersForRequest(request) {
    const candidates = [];

    if (Array.isArray(request.multimodalInputs) && request.multimodalInputs.length) {
      candidates.push('gemini');
    }

    const domain = (request.domain || request.intent || '').toLowerCase();
    const tags = Array.isArray(request.tags) ? request.tags.join(' ').toLowerCase() : '';
    const prompt = (request.prompt || '').toLowerCase();

    const referencesCode = /\b(function|def|class|console\.|#include|import )/.test(prompt) || domain === 'code' || tags.includes('code');
    if (referencesCode) {
      candidates.push('huggingface');
    }

    const complexFlag = request.complexity === 'high' || request.complexity === 'complex' || request.priority === 'accuracy';
    const longPrompt = (request.prompt || '').length > 1500 || (request.estimatedTokens || 0) > 1500;
    if (complexFlag || longPrompt) {
      candidates.push('groq');
    }

    if (request.lowLatency || request.priority === 'latency') {
      candidates.push('local');
    }

    const fallback = ['groq', 'huggingface', 'local', 'gemini'];
    const uniqueNames = [];

    for (const name of [...candidates, ...fallback]) {
      if (!uniqueNames.includes(name)) {
        uniqueNames.push(name);
      }
    }

    return uniqueNames;
  }

  _stableStringify(value) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this._stableStringify(item)).join(',')}]`;
    }

    const keys = Object.keys(value).sort();
    const result = keys.map((key) => `${JSON.stringify(key)}:${this._stableStringify(value[key])}`);
    return `{${result.join(',')}}`;
  }

  _cacheKey(request, providerName) {
    const hash = crypto.createHash('sha1');
    const payload = this._stableStringify({
      provider: providerName,
      prompt: request.prompt,
      domain: request.domain,
      intent: request.intent,
      tags: request.tags,
      systemPrompt: request.systemPrompt,
      context: request.context,
      multimodalInputs: request.multimodalInputs,
      options: request.options
    });
    hash.update(payload);
    return hash.digest('hex');
  }

  _selectProviderInstance(request, attempted = new Set()) {
    const ordered = this._orderedProvidersForRequest(request);

    for (const name of ordered) {
      const provider = this.providers[name];
      if (!provider) {
        continue;
      }

      if (attempted.has(name)) {
        continue;
      }

      if (!provider.matchesCapabilities(request)) {
        continue;
      }

      return { name, instance: provider };
    }

    // Fallback: pick any remaining provider not attempted.
    for (const [name, provider] of Object.entries(this.providers)) {
      if (attempted.has(name)) {
        continue;
      }

      if (!provider.matchesCapabilities || provider.matchesCapabilities(request)) {
        return { name, instance: provider };
      }
    }

    throw new ProviderError('No available providers could handle the request', {
      providerName: attempted.size ? Array.from(attempted).join(',') : 'none'
    });
  }

  _ensureSafe(request) {
    if (!this.safetyFilter) {
      return;
    }

    const result = this.safetyFilter.checkInput({ prompt: request.prompt });
    if (result?.allowed === false) {
      throw new SafetyError(result?.reason || 'Prompt blocked by safety filter');
    }
  }

  async complete(request, options = {}) {
    this._ensureSafe(request);

    const attempted = new Set(options.attemptedProviders || []);

    while (attempted.size < Object.keys(this.providers).length) {
      const { name, instance } = this._selectProviderInstance(request, attempted);
      const cacheKey = this._cacheKey(request, name);
      const useCache = options.useCache !== false && Boolean(this.cache);

      if (useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return {
            ...cached,
            provider: name,
            fromCache: true
          };
        }
      }

      try {
        const completion = await instance.generateCompletion(request);
        if (useCache) {
          this.cache.set(cacheKey, completion, instance.cacheTtlSeconds);
        }
        return {
          ...completion,
          provider: name,
          fromCache: false
        };
      } catch (error) {
        attempted.add(name);

        if (error.isRateLimit) {
          if (attempted.size >= Object.keys(this.providers).length) {
            throw error;
          }
          continue;
        }

        throw error;
      }
    }

    throw new ProviderError('All providers exhausted for completion request', {
      providerName: Array.from(attempted).join(',')
    });
  }

  async *streamComplete(request, options = {}) {
    this._ensureSafe(request);

    const attempted = new Set(options.attemptedProviders || []);
    const totalProviders = Object.keys(this.providers).length;

    while (attempted.size < totalProviders) {
      const { name, instance } = this._selectProviderInstance(request, attempted);
      const cacheKey = this._cacheKey(request, name);
      const useCache = options.useCache !== false && Boolean(this.cache);

      if (useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          yield { event: 'cache', provider: name };
          if (cached.text) {
            yield { event: 'chunk', provider: name, text: cached.text };
          }
          yield { event: 'end', provider: name, raw: cached.raw };
          return;
        }
      }

      const aggregatedChunks = [];

      try {
        for await (const chunk of instance.streamCompletion(request)) {
          if (chunk?.text) {
            aggregatedChunks.push(chunk.text);
          }
          yield { ...chunk, provider: name };
        }

        if (useCache) {
          const aggregated = {
            text: aggregatedChunks.join(''),
            raw: { chunks: aggregatedChunks }
          };
          this.cache.set(cacheKey, aggregated, instance.cacheTtlSeconds);
        }
        return;
      } catch (error) {
        attempted.add(name);

        if (error.isRateLimit) {
          if (attempted.size >= totalProviders) {
            throw error;
          }
          yield {
            event: 'warning',
            provider: name,
            message: 'Rate limit encountered, trying fallback provider'
          };
          continue;
        }

        throw error;
      }
    }

    throw new ProviderError('All providers exhausted during streaming request', {
      providerName: Array.from(attempted).join(',')
    });
  }
}

module.exports = AIOrchestrator;
