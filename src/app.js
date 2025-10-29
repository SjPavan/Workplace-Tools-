const express = require('express');
const createAICompletionRouter = require('./routes/ai');
const AIOrchestrator = require('./orchestration/orchestrator');
const MemoryCache = require('./cache/memoryCache');
const { createDefaultProviders } = require('./providers');
const { createSafetyFilter } = require('./safety/filters');
const { ProviderError, SafetyError } = require('./util/errors');

function createApp(options = {}) {
  const app = express();
  app.use(express.json({ limit: options.jsonLimit || '1mb' }));

  const cache = options.cache || new MemoryCache(options.cacheOptions);
  const safetyFilter = options.safetyFilter || createSafetyFilter(options.safetyOptions);
  const providers = options.providers || createDefaultProviders(options.providerOptions || {});
  const orchestrator = options.orchestrator || new AIOrchestrator({ providers, cache, safetyFilter });

  app.set('orchestrator', orchestrator);

  app.use('/ai', createAICompletionRouter({ orchestrator }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use((err, req, res, next) => {
    if (err instanceof SafetyError) {
      return res.status(400).json({ error: err.message, code: err.code || 'SAFETY_VIOLATION' });
    }

    if (err instanceof ProviderError) {
      if (err.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter));
      }

      const status = err.isRateLimit ? 429 : err.status || 502;
      return res.status(status).json({
        error: err.message,
        provider: err.providerName
      });
    }

    console.error('Unhandled error in /ai API route', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

module.exports = createApp;
