const crypto = require('crypto');
const { loadConfig } = require('./config');
const FCMClient = require('./fcm/fcmClient');
const DeliveryLogStore = require('./storage/deliveryLogStore');
const PreferencesStore = require('./storage/preferencesStore');
const SupabaseEmailFallback = require('./supabase/emailFallback');

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

class NotificationPipeline {
  constructor(options = {}) {
    const config = options.config || loadConfig(options.overrides);
    this.config = config;

    this.logStore =
      options.logStore || new DeliveryLogStore(this.config.storage.deliveryLogPath);
    this.preferencesStore =
      options.preferencesStore || new PreferencesStore(this.config.storage.preferencesPath);
    this.emailFallback =
      options.emailFallback ||
      new SupabaseEmailFallback({
        ...this.config.supabase,
        emailFallbackLogPath: this.config.storage.emailFallbackLogPath,
      });
    this.fcmClient = options.fcmClient || new FCMClient(this.config.fcm);
  }

  async handleEvent(event) {
    const normalized = this.#normalizeEvent(event);
    const { userId, type, target, notification, data, fallbackEmail } = normalized;

    const pushEnabled = await this.preferencesStore.isUserOptedIn(
      userId,
      'push',
      target.topic || null,
    );

    let pushResult;
    if (!pushEnabled) {
      pushResult = { status: 'skipped', reason: 'User opted out of push notifications' };
    } else {
      try {
        pushResult = await this.fcmClient.sendMessage({
          topic: target.topic,
          token: target.token,
          tokens: target.tokens,
          notification,
          data,
          options: normalized.options,
        });
      } catch (error) {
        pushResult = {
          status: 'error',
          reason: error.message,
          details: error.response || error,
        };
      }
    }

    let fallbackResult = null;
    const pushDelivered = pushResult.status === 'success';

    if (fallbackEmail && (!pushDelivered || pushResult.status === 'skipped')) {
      const emailOptIn = await this.preferencesStore.isUserOptedIn(
        userId,
        'email',
        target.topic || null,
      );
      if (emailOptIn) {
        try {
          fallbackResult = await this.emailFallback.sendEmail({
            ...fallbackEmail,
            metadata: {
              ...fallbackEmail.metadata,
              sourceEventId: normalized.id,
              eventType: type,
            },
          });
        } catch (error) {
          fallbackResult = {
            status: 'error',
            reason: error.message,
            details: error.response || error,
          };
        }
      } else {
        fallbackResult = {
          status: 'skipped',
          reason: 'User opted out of email notifications',
        };
      }
    }

    const logEntry = await this.logStore.append({
      eventId: normalized.id,
      eventType: type,
      userId,
      topic: target.topic || null,
      status: pushResult.status,
      push: {
        status: pushResult.status,
        reason: pushResult.reason,
      },
      fallback: fallbackResult
        ? {
            status: fallbackResult.status,
            reason: fallbackResult.reason,
          }
        : null,
    });

    return {
      logEntry,
      push: pushResult,
      fallback: fallbackResult,
      event: normalized,
    };
  }

  async recordUserPreference(userId, preferences) {
    return this.preferencesStore.setUserPreferences(userId, preferences);
  }

  async getUserPreferences(userId) {
    return this.preferencesStore.getUserPreferences(userId);
  }

  async getDeliveryLogs(filter = {}) {
    return this.logStore.getLogs(filter);
  }

  #normalizeEvent(event) {
    if (!event) {
      throw new Error('Event payload is required');
    }

    const id = event.id || generateId();
    const type = event.type || 'custom';
    const userId = event.userId || null;
    const topic = event.topic || this.#inferTopicFromType(type);
    const title = event.title || event.notification?.title;
    const body = event.body || event.notification?.body;

    const notification = event.notification || (title || body
      ? {
          title: title || undefined,
          body: body || undefined,
        }
      : undefined);

    if (!notification && !event.data) {
      throw new Error('Notification event requires either a notification payload or data');
    }

    const target = {
      topic: topic || null,
      token: event.token || null,
      tokens: event.tokens || null,
    };

    const fallbackEmail = event.fallbackEmail || (event.email
      ? {
          to: event.email,
          subject: `Notification: ${title || type}`,
          body: body || JSON.stringify(event.data || {}),
        }
      : null);

    return {
      id,
      type,
      userId,
      target,
      notification,
      data: event.data || null,
      fallbackEmail,
      options: event.options || {},
    };
  }

  #inferTopicFromType(type) {
    if (!type) {
      return null;
    }

    const normalized = String(type).toLowerCase();
    if (normalized.includes('reminder')) {
      return this.config.defaults.reminderTopic;
    }
    if (
      normalized.includes('scrap') ||
      normalized.includes('scrape') ||
      normalized.includes('scraper')
    ) {
      return `${this.config.fcm.topicPrefix}scraping-complete`;
    }
    if (normalized.includes('proactive')) {
      return `${this.config.fcm.topicPrefix}proactive-updates`;
    }
    return null;
  }
}

module.exports = NotificationPipeline;
