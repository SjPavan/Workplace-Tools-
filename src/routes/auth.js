const express = require('express');
const { getSupabaseClient } = require('../services/supabaseService');
const sessionStore = require('../services/sessionStore');
const deviceRegistry = require('../services/deviceRegistry');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function normalizeUser(user) {
  if (!user) return null;
  const role = user.role || user.app_metadata?.role || user.user_metadata?.role || 'user';
  return {
    id: user.id,
    email: user.email,
    role
  };
}

function persistSession(session, user) {
  if (!session || !session.access_token) return;
  const expiresAt = session.expires_at
    ? new Date(session.expires_at * 1000).toISOString()
    : null;
  sessionStore.saveSession({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    user: normalizeUser(user),
    expiresAt
  });
}

router.post('/login/email', async (req, res) => {
  const { email, password, deviceToken, deviceName } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message || 'Invalid credentials' });
    }
    const { session, user } = data;
    if (!session || !user) {
      return res.status(500).json({ error: 'Supabase did not return a session' });
    }
    persistSession(session, user);
    if (deviceToken) {
      deviceRegistry.registerDevice(user.id, deviceToken, { deviceName });
      deviceRegistry.attachRefreshToken(user.id, deviceToken, session.refresh_token);
    }
    return res.json({
      user: normalizeUser(user),
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        tokenType: session.token_type,
        expiresIn: session.expires_in
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/login/google', async (req, res) => {
  const { authCode, redirectUri, deviceToken, deviceName } = req.body || {};
  if (!authCode) {
    return res.status(400).json({ error: 'authCode is required' });
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession({ authCode, redirectTo: redirectUri });
    if (error) {
      return res.status(401).json({ error: error.message || 'Failed to exchange OAuth code' });
    }
    const { session, user } = data;
    if (!session || !user) {
      return res.status(500).json({ error: 'Supabase did not return a session' });
    }
    persistSession(session, user);
    if (deviceToken) {
      deviceRegistry.registerDevice(user.id, deviceToken, { deviceName });
      deviceRegistry.attachRefreshToken(user.id, deviceToken, session.refresh_token);
    }
    return res.json({
      user: normalizeUser(user),
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        tokenType: session.token_type,
        expiresIn: session.expires_in
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/session/refresh', async (req, res) => {
  const { refreshToken, deviceToken, userId } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      return res.status(401).json({ error: error.message || 'Unable to refresh session' });
    }
    const { session, user } = data;
    if (!session || !user) {
      return res.status(500).json({ error: 'Supabase did not return a refreshed session' });
    }
    persistSession(session, user);
    if (userId && deviceToken) {
      deviceRegistry.attachRefreshToken(userId, deviceToken, session.refresh_token);
    }
    return res.json({
      user: normalizeUser(user),
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        tokenType: session.token_type,
        expiresIn: session.expires_in
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/session/exchange', async (req, res) => {
  const { userId, deviceToken } = req.body || {};
  if (!userId || !deviceToken) {
    return res.status(400).json({ error: 'userId and deviceToken are required' });
  }
  try {
    const device = deviceRegistry.validateDevice(userId, deviceToken);
    if (!device) {
      return res.status(403).json({ error: 'Unknown device' });
    }
    const refreshToken = deviceRegistry.getRefreshToken(userId, deviceToken);
    if (!refreshToken) {
      return res.status(409).json({ error: 'Device not associated with a refresh token' });
    }
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      return res.status(401).json({ error: error.message || 'Unable to exchange refresh token' });
    }
    const { session, user } = data;
    if (!session || !user) {
      return res.status(500).json({ error: 'Supabase did not return a session' });
    }
    persistSession(session, user);
    deviceRegistry.attachRefreshToken(userId, deviceToken, session.refresh_token);
    return res.json({
      user: normalizeUser(user),
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        tokenType: session.token_type,
        expiresIn: session.expires_in
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/device/register', (req, res) => {
  const { userId, deviceToken, deviceName } = req.body || {};
  if (!userId || !deviceToken) {
    return res.status(400).json({ error: 'userId and deviceToken are required' });
  }
  try {
    const sanitized = deviceRegistry.registerDevice(userId, deviceToken, { deviceName });
    const latestSession = sessionStore.getLatestSessionForUser(userId);
    if (latestSession?.refreshToken) {
      deviceRegistry.attachRefreshToken(userId, deviceToken, latestSession.refreshToken);
    }
    return res.status(201).json({ device: sanitized });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
