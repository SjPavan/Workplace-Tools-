const fs = require('fs');
const path = require('path');
const { ensureDirectory } = require('../util/filesystem');

class DeliveryLogStore {
  constructor(logPath) {
    this.logPath = logPath;
    ensureDirectory(path.dirname(this.logPath));
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, '', 'utf8');
    }
  }

  async append(entry) {
    const record = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const serialized = `${JSON.stringify(record)}\n`;
    await fs.promises.appendFile(this.logPath, serialized, 'utf8');
    return record;
  }

  async getLogs(filter = {}) {
    const { userId, status, eventType } = filter;
    const content = await fs.promises.readFile(this.logPath, 'utf8').catch((error) => {
      if (error.code === 'ENOENT') {
        return '';
      }
      throw error;
    });
    if (!content.trim()) {
      return [];
    }

    const lines = content.trim().split('\n');
    return lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean)
      .filter((log) => {
        if (userId && log.userId !== userId) {
          return false;
        }
        if (status && log.status !== status) {
          return false;
        }
        if (eventType && log.eventType !== eventType) {
          return false;
        }
        return true;
      });
  }

  async getLogsForUser(userId) {
    return this.getLogs({ userId });
  }
}

module.exports = DeliveryLogStore;
