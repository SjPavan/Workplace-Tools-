class GoogleTokenStore {
  constructor() {
    this.tokens = new Map();
  }

  saveTokens(userId, tokens) {
    if (!userId) throw new Error('userId required');
    if (!tokens) throw new Error('tokens required');
    this.tokens.set(userId, {
      ...tokens,
      storedAt: new Date().toISOString()
    });
  }

  getTokens(userId) {
    return this.tokens.get(userId) || null;
  }

  reset() {
    this.tokens.clear();
  }
}

module.exports = new GoogleTokenStore();
