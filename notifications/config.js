const path = require('path');
const { ensureDirectory } = require('./util/filesystem');

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

function loadConfig(overrides = {}) {
  const rootDir = overrides.rootDir || path.resolve(__dirname, '..');
  const dataDir = overrides.dataDir || path.resolve(rootDir, 'data');

  ensureDirectory(dataDir);

  const serverKey = overrides.fcm?.serverKey ?? process.env.FCM_SERVER_KEY ?? null;
  const dryRun = overrides.fcm?.dryRun ?? !serverKey;
  const supabaseUrl = overrides.supabase?.url ?? process.env.SUPABASE_URL ?? null;
  const supabaseServiceRoleKey =
    overrides.supabase?.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
  const supabaseEnabled =
    overrides.supabase?.enabled ?? (Boolean(supabaseUrl) && Boolean(supabaseServiceRoleKey));

  const config = {
    appName: overrides.appName || process.env.NOTIFICATIONS_APP_NAME || 'NotificationPipeline',
    fcm: {
      serverKey,
      projectId: overrides.fcm?.projectId ?? process.env.FCM_PROJECT_ID ?? null,
      senderId: overrides.fcm?.senderId ?? process.env.FCM_SENDER_ID ?? null,
      topicPrefix: overrides.fcm?.topicPrefix ?? process.env.FCM_TOPIC_PREFIX ?? '',
      dryRun,
      baseUrl: overrides.fcm?.baseUrl ?? process.env.FCM_BASE_URL ?? 'https://fcm.googleapis.com',
      apiPath: overrides.fcm?.apiPath ?? process.env.FCM_API_PATH ?? '/fcm/send',
      legacyHttp: overrides.fcm?.legacyHttp ?? (process.env.FCM_LEGACY_HTTP ? process.env.FCM_LEGACY_HTTP === 'true' : true),
    },
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
      emailFunctionPath:
        overrides.supabase?.emailFunctionPath ??
        process.env.SUPABASE_EMAIL_FUNCTION_PATH ??
        '/functions/v1/send-email',
      enabled: supabaseEnabled,
    },
    storage: {
      dataDir,
      deliveryLogPath:
        overrides.storage?.deliveryLogPath ?? path.resolve(dataDir, 'delivery-log.ndjson'),
      emailFallbackLogPath:
        overrides.storage?.emailFallbackLogPath ?? path.resolve(dataDir, 'email-fallback.log'),
      preferencesPath:
        overrides.storage?.preferencesPath ?? path.resolve(dataDir, 'user-preferences.json'),
    },
    defaults: {
      reminderTopic:
        overrides.defaults?.reminderTopic ?? process.env.DEFAULT_REMINDER_TOPIC ?? 'proactive-reminders',
    },
  };

  return config;
}

module.exports = {
  loadConfig,
  ConfigError,
};
