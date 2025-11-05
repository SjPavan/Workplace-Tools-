const https = require('https');
const { URL } = require('url');

function normalizeData(data = {}) {
  return Object.entries(data).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
    return acc;
  }, {});
}

class FCMClient {
  constructor(config) {
    this.serverKey = config.serverKey;
    this.baseUrl = config.baseUrl || 'https://fcm.googleapis.com';
    this.apiPath = config.apiPath || '/fcm/send';
    this.dryRun = Boolean(config.dryRun);
    this.legacyHttp = config.legacyHttp !== false;
  }

  async sendMessage({ topic, token, tokens, notification, data, options = {} }) {
    if (!topic && !token && !(tokens && tokens.length)) {
      throw new Error('FCM send requires a topic, token, or list of tokens');
    }

    if (this.dryRun) {
      return {
        status: 'dry-run',
        reason: 'FCM dry-run mode is enabled – message was not submitted to FCM',
        request: {
          topic,
          tokenCount: tokens ? tokens.length : token ? 1 : 0,
          notification,
          data,
        },
      };
    }

    if (!this.serverKey) {
      throw new Error('FCM server key is required when not running in dry-run mode');
    }

    if (!this.legacyHttp) {
      throw new Error('Only the legacy HTTP API is implemented in this client');
    }

    const body = {
      ...options,
      notification: notification || undefined,
      data: data ? normalizeData(data) : undefined,
    };

    if (topic) {
      body.to = topic.startsWith('/topics/') ? topic : `/topics/${topic}`;
    } else if (token) {
      body.to = token;
    } else if (tokens) {
      body.registration_ids = tokens;
    }

    const response = await this.#postLegacy(body);
    return response;
  }

  #postLegacy(payload) {
    const url = new URL(this.apiPath, this.baseUrl);

    const body = JSON.stringify(payload);

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `key=${this.serverKey}`,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, requestOptions, (res) => {
        let chunks = '';
        res.on('data', (chunk) => {
          chunks += chunk;
        });
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          const isSuccess = statusCode >= 200 && statusCode < 300;
          let parsed;
          try {
            parsed = chunks ? JSON.parse(chunks) : {};
          } catch (error) {
            parsed = { raw: chunks };
          }

          const result = {
            status: isSuccess ? 'success' : 'error',
            httpStatus: statusCode,
            response: parsed,
          };

          if (isSuccess) {
            resolve(result);
          } else {
            reject(Object.assign(new Error(`FCM request failed with status ${statusCode}`), result));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(body);
      req.end();
    });
  }
}

module.exports = FCMClient;
