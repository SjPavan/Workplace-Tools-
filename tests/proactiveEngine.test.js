import assert from "assert";
import { NotificationQueue } from "../src/services/notificationQueue.js";
import { defaultConfig } from "../src/config/defaultConfig.js";
import { ProactiveIntelligenceService } from "../src/services/proactiveIntelligenceService.js";

function buildConfig(overrides = {}) {
  return {
    ...defaultConfig,
    ...overrides,
    quietHours: {
      ...defaultConfig.quietHours,
      ...(overrides.quietHours || {})
    },
    deduplication: {
      ...defaultConfig.deduplication,
      ...(overrides.deduplication || {})
    }
  };
}

async function testQuietHoursScheduling() {
  const config = buildConfig();
  const queue = new NotificationQueue(config);
  const scheduled = new Date("2024-05-20T23:30:00Z");
  queue.enqueue({
    userId: "user-1",
    type: "habit_reminder",
    payload: { body: "hydrate" },
    scheduledFor: scheduled
  });

  assert.strictEqual(queue.queue.length, 1, "Notification should be queued");
  const notification = queue.queue[0];
  assert(
    notification.metadata.quietHoursDeferral,
    "Notification should note quiet hours deferral"
  );
  assert.strictEqual(
    notification.scheduledFor.toISOString(),
    "2024-05-21T07:00:00.000Z",
    "Notification should be rescheduled to the end of quiet hours"
  );
}

async function testProcessDefersDuringQuietHours() {
  const config = buildConfig();
  const queue = new NotificationQueue(config);
  queue.enqueue({
    userId: "user-2",
    type: "calendar_preparation",
    payload: { body: "Prepare for stand-up" },
    scheduledFor: new Date("2024-05-20T21:45:00Z")
  });

  const dueBeforeQuiet = queue.processDueNotifications("2024-05-20T21:50:00Z");
  assert.strictEqual(dueBeforeQuiet.length, 1, "Should dispatch before quiet hours");

  queue.enqueue({
    userId: "user-2",
    type: "calendar_preparation",
    payload: { body: "Prepare for retro" },
    scheduledFor: new Date("2024-05-20T22:30:00Z")
  });

  const duringQuiet = queue.processDueNotifications("2024-05-20T22:45:00Z");
  assert.strictEqual(duringQuiet.length, 0, "Should defer during quiet hours");
  assert.strictEqual(queue.queue.length, 1, "Notification should remain queued");
  const remaining = queue.queue[0];
  assert.strictEqual(
    remaining.scheduledFor.toISOString(),
    "2024-05-21T07:00:00.000Z",
    "Deferred notification should move to quiet hour exit"
  );
}

async function testDeduplicationWindow() {
  const config = buildConfig({
    deduplication: {
      windowMinutes: 90
    }
  });
  const queue = new NotificationQueue(config);
  const scheduled = new Date("2024-05-20T18:00:00Z");

  queue.enqueue({
    userId: "user-3",
    type: "mood_check_in",
    payload: { body: "Take a breath" },
    scheduledFor: scheduled
  });

  queue.enqueue({
    userId: "user-3",
    type: "mood_check_in",
    payload: { body: "New prompt" },
    scheduledFor: new Date("2024-05-20T18:45:00Z"),
    metadata: { reason: "updated" }
  });

  assert.strictEqual(queue.queue.length, 1, "Duplicate within window should merge");
  const merged = queue.queue[0];
  assert.strictEqual(
    merged.scheduledFor.toISOString(),
    "2024-05-20T18:45:00.000Z",
    "Merged notification uses latest schedule"
  );
  assert(merged.metadata.dedupMerged, "Metadata should reflect deduplication");
}

async function testEndToEndEvaluation() {
  const config = buildConfig();
  const queue = new NotificationQueue(config);
  const service = new ProactiveIntelligenceService({
    config,
    notificationQueue: queue
  });
  const referenceTime = new Date("2024-05-20T20:30:00Z");
  const userContext = {
    userId: "user-10",
    calendarEvents: [
      {
        id: "event-a",
        title: "Design review",
        start: "2024-05-20T21:00:00Z",
        end: "2024-05-20T21:30:00Z",
        importance: "high"
      }
    ],
    habits: [
      {
        name: "Daily reflection",
        lastCompletedAt: "2024-05-19T21:00:00Z",
        cadence: "daily",
        preferredTime: "21:15",
        streak: 7
      }
    ],
    moodEntries: [
      { timestamp: "2024-05-20T08:00:00Z", score: 3.2 },
      { timestamp: "2024-05-20T12:00:00Z", score: 3.0 },
      { timestamp: "2024-05-20T18:00:00Z", score: 2.6 }
    ]
  };

  const evaluation = service.evaluate(userContext, { referenceTime });
  assert(
    evaluation.suggestions.length > 0,
    "Service should generate proactive suggestions"
  );
  evaluation.enqueued.forEach((item) => {
    assert(item.score >= config.thresholds.minimumNotificationScore);
  });
}

export async function run() {
  await testQuietHoursScheduling();
  await testProcessDefersDuringQuietHours();
  await testDeduplicationWindow();
  await testEndToEndEvaluation();
  console.log("proactiveEngine.test.js: all tests passed");
}
