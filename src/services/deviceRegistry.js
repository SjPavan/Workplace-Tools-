const { hashToken, matchHashedToken } = require('../utils/hash');

class DeviceRegistry {
  constructor() {
    this.registry = new Map();
  }

  registerDevice(userId, rawToken, metadata = {}) {
    if (!userId) throw new Error('userId required');
    if (!rawToken) throw new Error('device token required');
    const userDevices = this.registry.get(userId) || new Map();
    const hashedToken = hashToken(rawToken);
    const record = {
      hashedToken,
      deviceName: metadata.deviceName || 'unknown',
      registeredAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      refreshToken: metadata.refreshToken || null,
      metadata: metadata.metadata || {}
    };
    userDevices.set(hashedToken, record);
    this.registry.set(userId, userDevices);
    const { hashedToken: _removed, refreshToken: _refreshRemoved, ...publicRecord } = record;
    return publicRecord;
  }

  attachRefreshToken(userId, rawToken, refreshToken) {
    if (!userId || !rawToken) return;
    const userDevices = this.registry.get(userId);
    if (!userDevices) return;
    const hashedToken = hashToken(rawToken);
    const device = userDevices.get(hashedToken);
    if (!device) return;
    device.refreshToken = refreshToken;
    device.lastSeenAt = new Date().toISOString();
  }

  validateDevice(userId, rawToken) {
    if (!userId || !rawToken) return null;
    const userDevices = this.registry.get(userId);
    if (!userDevices) return null;
    for (const record of userDevices.values()) {
      if (matchHashedToken(record.hashedToken, rawToken)) {
        record.lastSeenAt = new Date().toISOString();
        const { hashedToken: _removed, refreshToken: _refreshRemoved, ...publicRecord } = record;
        return publicRecord;
      }
    }
    return null;
  }

  getRefreshToken(userId, rawToken) {
    const userDevices = this.registry.get(userId);
    if (!userDevices) return null;
    const hashedToken = hashToken(rawToken);
    const device = userDevices.get(hashedToken);
    return device ? device.refreshToken : null;
  }

  listDevices(userId) {
    const userDevices = this.registry.get(userId) || new Map();
    return Array.from(userDevices.values()).map(({ hashedToken, refreshToken, ...rest }) => rest);
  }

  reset() {
    this.registry.clear();
  }
}

module.exports = new DeviceRegistry();
