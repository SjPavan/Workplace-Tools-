class MemoryCache {
  constructor({ defaultTtlSeconds = 120, maxEntries = 500 } = {}) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.maxEntries = maxEntries;
    this.store = new Map();
  }

  _isExpired(entry) {
    return typeof entry.expiresAt === 'number' && entry.expiresAt <= Date.now();
  }

  _pruneExpired() {
    for (const [key, entry] of this.store) {
      if (this._isExpired(entry)) {
        this.store.delete(key);
      }
    }
  }

  _evictIfNeeded() {
    while (this.store.size > this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.store.delete(oldestKey);
    }
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (this._isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key, value, ttlSeconds) {
    const expiresInMs = (ttlSeconds ?? this.defaultTtlSeconds) * 1000;
    const expiresAt = Number.isFinite(expiresInMs) ? Date.now() + expiresInMs : undefined;

    this.store.set(key, { value, expiresAt });
    this._evictIfNeeded();
    return value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  clear() {
    this.store.clear();
  }

  size() {
    this._pruneExpired();
    return this.store.size;
  }
}

module.exports = MemoryCache;
