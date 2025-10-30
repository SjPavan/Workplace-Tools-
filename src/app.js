const express = require('express');
const rateLimit = require('express-rate-limit');
const { handleGenerate, handleExplain, handleDebug } = require('./services/assistantService');

const app = express();

app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Try again shortly.'
  }
});

app.use('/api/', limiter);

function validateBody(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Expected JSON payload.' });
  }
  return next();
}

app.post('/api/assistant/generate', validateBody, (req, res) => {
  const payload = req.body;
  const response = handleGenerate(payload);
  res.json(response);
});

app.post('/api/assistant/explain', validateBody, (req, res) => {
  const payload = req.body;
  const response = handleExplain(payload);
  res.json(response);
});

app.post('/api/assistant/debug', validateBody, (req, res) => {
  const payload = req.body;
  const response = handleDebug(payload);
  res.json(response);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error in assistant API:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
