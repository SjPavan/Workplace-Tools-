const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const googleTokenStore = require('../services/googleTokenStore');
const calendarService = require('../services/calendarService');

const router = express.Router();

router.post('/oauth/google', authenticate, requireRole(['user', 'admin']), async (req, res) => {
  const { code, redirectUri } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'authorization code is required' });
  }
  try {
    const tokens = await calendarService.exchangeCodeForTokens({ code, redirectUri });
    googleTokenStore.saveTokens(req.user.id, tokens);
    return res.status(200).json({ message: 'Google account linked', expiresIn: tokens.expiry_date || null });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

router.get('/events', authenticate, requireRole(['user', 'admin']), async (req, res) => {
  try {
    const tokens = googleTokenStore.getTokens(req.user.id);
    if (!tokens) {
      return res.status(404).json({ error: 'No Google tokens stored for user' });
    }
    const events = await calendarService.listUpcomingEvents(tokens, {
      calendarId: req.query.calendarId || 'primary',
      maxResults: req.query.maxResults ? Number(req.query.maxResults) : 10
    });
    return res.json({ events });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;
