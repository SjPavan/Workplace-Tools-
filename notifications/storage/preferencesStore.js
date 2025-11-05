const path = require('path');
const { ensureDirectory, readJsonFile, writeJsonFile } = require('../util/filesystem');

const DEFAULT_CHANNEL_PREFERENCES = {
  channels: {
    push: true,
    email: true,
  },
  topics: {},
};

class PreferencesStore {
  constructor(filePath) {
    this.filePath = filePath;
    ensureDirectory(path.dirname(this.filePath));
  }

  async #readAll() {
    return readJsonFile(this.filePath, {});
  }

  async #writeAll(payload) {
    await writeJsonFile(this.filePath, payload);
  }

  async getUserPreferences(userId) {
    const all = await this.#readAll();
    if (!userId) {
      return { ...DEFAULT_CHANNEL_PREFERENCES };
    }
    const found = all[userId];
    if (!found) {
      return JSON.parse(JSON.stringify(DEFAULT_CHANNEL_PREFERENCES));
    }
    return {
      ...DEFAULT_CHANNEL_PREFERENCES,
      ...found,
      channels: {
        ...DEFAULT_CHANNEL_PREFERENCES.channels,
        ...(found.channels || {}),
      },
      topics: {
        ...DEFAULT_CHANNEL_PREFERENCES.topics,
        ...(found.topics || {}),
      },
    };
  }

  async setUserPreferences(userId, update) {
    if (!userId) {
      throw new Error('Cannot persist preferences without a userId');
    }
    const all = await this.#readAll();
    const existing = await this.getUserPreferences(userId);
    const merged = {
      ...existing,
      ...update,
      channels: {
        ...existing.channels,
        ...(update.channels || {}),
      },
      topics: {
        ...existing.topics,
        ...(update.topics || {}),
      },
    };
    all[userId] = merged;
    await this.#writeAll(all);
    return merged;
  }

  async isUserOptedIn(userId, channel, topic = null) {
    if (!userId) {
      return true;
    }
    const prefs = await this.getUserPreferences(userId);

    if (channel === 'push') {
      const base = prefs.channels?.push !== false;
      if (!base) {
        return false;
      }
      if (topic && prefs.topics?.[topic]) {
        const topicConfig = prefs.topics[topic];
        if (topicConfig.push === false) {
          return false;
        }
        if (topicConfig.push === true) {
          return true;
        }
      }
      return true;
    }

    if (channel === 'email') {
      const base = prefs.channels?.email !== false;
      if (!base) {
        return false;
      }
      if (topic && prefs.topics?.[topic]) {
        const topicConfig = prefs.topics[topic];
        if (topicConfig.email === false) {
          return false;
        }
      }
      return true;
    }

    return true;
  }
}

module.exports = PreferencesStore;
