#!/usr/bin/env node

const path = require('path');
const {
  loadConfig,
  NotificationPipeline,
} = require('../notifications');

async function run() {
  const config = loadConfig({});
  const pipeline = new NotificationPipeline({ config });

  console.log(`\nNotification pipeline sample run (${config.appName})`);
  console.log(`FCM mode: ${config.fcm.dryRun ? 'DRY RUN (no push sent)' : 'LIVE'}`);
  console.log(`Data directory: ${config.storage.dataDir}`);

  const events = [
    {
      type: 'proactive-reminder',
      userId: 'user-pro',
      title: 'Stand-up summary',
      body: 'Your proactive digest is ready to review.',
      data: {
        category: 'proactive-digest',
        priority: 'normal',
      },
      fallbackEmail: {
        to: 'user-pro@example.com',
        subject: '[Proactive] Your digest is ready',
        body: 'Open the app to review the latest proactive items.',
      },
    },
    {
      type: 'scraping-job-complete',
      userId: 'user-pro',
      title: 'Scraping job finished',
      body: 'The sourcing job #42 processed 531 new leads.',
      data: {
        jobId: 'job-42',
        source: 'leads-scraper',
        completedAt: new Date().toISOString(),
      },
      fallbackEmail: {
        to: 'user-pro@example.com',
        subject: '[Scraper] Job #42 completed',
        body: 'Review the freshly imported leads in the dashboard.',
      },
    },
    {
      type: 'reminder',
      userId: 'user-silent',
      title: 'Daily reminder',
      body: 'Opted-out user should trigger email fallback only.',
      data: {
        reason: 'user-opted-out-push',
      },
      fallbackEmail: {
        to: 'user-silent@example.com',
        subject: 'Daily reminder',
        body: 'Push channel skipped; delivered via email fallback.',
      },
    },
  ];

  const results = [];
  for (const event of events) {
    const result = await pipeline.handleEvent(event);
    results.push({ event: event.type, outcome: result });
    console.log(`\nEvent: ${event.type}`);
    console.log('Push result:', result.push);
    if (result.fallback) {
      console.log('Fallback:', result.fallback);
    }
    console.log('Log entry:', result.logEntry);
  }

  const allLogs = await pipeline.getDeliveryLogs();
  console.log(`\nStored delivery logs (${allLogs.length} entries)`);
  allLogs.forEach((log) => {
    console.log('-', log.timestamp, log.eventType, log.userId, log.status);
  });

  console.log('\nSample run complete. Inspect data directory for persisted logs and preferences.');

  return results;
}

run().catch((error) => {
  console.error('Sample notification run failed:', error);
  process.exit(1);
});
