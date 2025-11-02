const express = require('express');
const { ProviderError, SafetyError } = require('../util/errors');

function createAICompletionRouter({ orchestrator }) {
  if (!orchestrator) {
    throw new Error('AI completion router requires an orchestrator instance');
  }

  const router = express.Router();

  router.post('/complete', async (req, res, next) => {
    const { stream } = req.query;
    const payload = req.body || {};

    if (stream === 'true') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      (async () => {
        try {
          for await (const chunk of orchestrator.streamComplete(payload)) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          res.write('event: done\ndata: {}\n\n');
          res.end();
        } catch (error) {
          const eventName = error.isRateLimit ? 'rate-limit' : 'error';
          const message = error instanceof ProviderError || error instanceof SafetyError
            ? error.message
            : 'Internal error';
          res.write(`event: ${eventName}\ndata: ${JSON.stringify({
            error: message,
            provider: error.providerName,
            status: error.status || 500
          })}\n\n`);
          res.end();
        }
      })();

      return;
    }

    try {
      const result = await orchestrator.complete(payload);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = createAICompletionRouter;
