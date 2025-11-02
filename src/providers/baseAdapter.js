const { ProviderError } = require('../util/errors');

class AIModelAdapter {
  constructor({
    name,
    model,
    httpClient,
    cacheTtlSeconds = 120,
    capabilities = {}
  } = {}) {
    if (!name) {
      throw new Error('Provider adapters require a name');
    }

    this.name = name;
    this.model = model;
    this.httpClient = httpClient;
    this.cacheTtlSeconds = cacheTtlSeconds;
    this.capabilities = {
      domains: capabilities.domains || [],
      modalities: capabilities.modalities || [],
      priorities: capabilities.priorities || []
    };
  }

  matchesCapabilities(request = {}) {
    const { domain, modality, priority } = request;

    if (domain && this.capabilities.domains.length && !this.capabilities.domains.includes(domain)) {
      return false;
    }

    if (modality && this.capabilities.modalities.length && !this.capabilities.modalities.includes(modality)) {
      return false;
    }

    if (priority && this.capabilities.priorities.length && !this.capabilities.priorities.includes(priority)) {
      return false;
    }

    return true;
  }

  async generateCompletion() {
    throw new ProviderError(`Provider ${this.name} has not implemented generateCompletion`, {
      providerName: this.name
    });
  }

  async *streamCompletion(payload) {
    const { text, raw } = await this.generateCompletion(payload);
    yield { event: 'chunk', text };
    yield { event: 'end', raw };
  }
}

module.exports = AIModelAdapter;
