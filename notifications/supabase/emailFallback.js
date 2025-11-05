const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { ensureDirectory } = require('../util/filesystem');

class SupabaseEmailFallback {
  constructor(config) {
    this.url = config.url;
    this.serviceRoleKey = config.serviceRoleKey;
    this.functionPath = config.emailFunctionPath || '/functions/v1/send-email';
    this.enabled = Boolean(config.enabled && this.url && this.serviceRoleKey);
    this.logPath = config.emailFallbackLogPath;
    if (this.logPath) {
      ensureDirectory(path.dirname(this.logPath));
    }
  }

  async sendEmail({ to, subject, body, metadata = {} }) {
    const payload = {
      to,
      subject,
      body,
      metadata,
    };

    if (!this.enabled) {
      await this.#logFallback({ ...payload, reason: 'disabled' });
      return {
        status: 'disabled',
        reason: 'Supabase email fallback disabled or misconfigured',
        payload,
      };
    }

    try {
      const response = await this.#invokeFunction(payload);
      await this.#logFallback({ ...payload, status: response.status, reason: 'invoked' });
      return response;
    } catch (error) {
      await this.#logFallback({ ...payload, status: 'error', reason: error.message });
      throw error;
    }
  }

  #invokeFunction(body) {
    const endpoint = new URL(this.functionPath, this.url);
    const serialized = JSON.stringify(body);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(serialized),
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(endpoint, options, (res) => {
        let chunks = '';
        res.on('data', (chunk) => {
          chunks += chunk;
        });
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          const success = statusCode >= 200 && statusCode < 300;
          let parsed;
          try {
            parsed = chunks ? JSON.parse(chunks) : {};
          } catch (error) {
            parsed = { raw: chunks };
          }

          const result = {
            status: success ? 'success' : 'error',
            httpStatus: statusCode,
            response: parsed,
          };

          if (success) {
            resolve(result);
          } else {
            const err = new Error(`Supabase function returned status ${statusCode}`);
            Object.assign(err, result);
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(serialized);
      req.end();
    });
  }

  async #logFallback(entry) {
    if (!this.logPath) {
      return;
    }
    const record = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await fs.promises.appendFile(this.logPath, `${JSON.stringify(record)}\n`, 'utf8');
  }
}

module.exports = SupabaseEmailFallback;
