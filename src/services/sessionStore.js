class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  saveSession({ accessToken, refreshToken, user, expiresAt }) {
    if (!accessToken) throw new Error('accessToken required');
    this.sessions.set(accessToken, {
      accessToken,
      refreshToken: refreshToken || null,
      user: user || null,
      expiresAt: expiresAt || null,
      storedAt: new Date().toISOString()
    });
  }

  getSession(accessToken) {
    if (!accessToken) return null;
    return this.sessions.get(accessToken) || null;
  }

  getLatestSessionForUser(userId) {
    if (!userId) return null;
    const candidates = Array.from(this.sessions.values()).filter((session) => {
      return session.user && session.user.id === userId;
    });
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => new Date(b.storedAt) - new Date(a.storedAt));
    return candidates[0];
  }

  remove(accessToken) {
    if (!accessToken) return; 
    this.sessions.delete(accessToken);
  }

  reset() {
    this.sessions.clear();
  }
}

module.exports = new SessionStore();
