#!/usr/bin/env node
import { ProactiveIntelligenceService } from "../src/services/proactiveIntelligenceService.js";
import { NotificationQueue } from "../src/services/notificationQueue.js";
import { FCMClient } from "../src/services/fcmClient.js";
import { defaultConfig } from "../src/config/defaultConfig.js";
import { addMinutes, formatDateTime } from "../src/utils/time.js";

function logSection(title) {
  console.log("\n=== " + title + " ===");
}

async function runSimulation() {
  const referenceTime = new Date("2024-05-20T20:30:00Z");
  const userContext = {
    userId: "user-123",
    calendarEvents: [
      {
        id: "event-1",
        title: "Product strategy sync",
        start: "2024-05-20T21:15:00Z",
        end: "2024-05-20T22:00:00Z",
        importance: "high"
      },
      {
        id: "event-2",
        title: "Lunch with mentor",
        start: "2024-05-21T12:00:00Z",
        end: "2024-05-21T13:00:00Z",
        importance: "low"
      }
    ],
    habits: [
      {
        name: "Evening shutdown",
        lastCompletedAt: "2024-05-19T21:00:00Z",
        cadence: "daily",
        preferredTime: "21:30",
        streak: 4
      },
      {
        name: "Morning journaling",
        lastCompletedAt: "2024-05-20T12:00:00Z",
        cadence: "daily",
        preferredTime: "07:30",
        streak: 12
      }
    ],
    moodEntries: [
      { timestamp: "2024-05-20T08:00:00Z", score: 3.8 },
      { timestamp: "2024-05-20T12:00:00Z", score: 3.5 },
      { timestamp: "2024-05-20T18:00:00Z", score: 3.1 }
    ]
  };

  const fcmClient = new FCMClient({ projectId: "demo-proactive" });
  const queue = new NotificationQueue(defaultConfig, { fcmClient });
  const service = new ProactiveIntelligenceService({
    config: defaultConfig,
    notificationQueue: queue
  });

  logSection("Gathering proactive suggestions");
  const evaluation = service.evaluate(userContext, { referenceTime });
  console.table(
    evaluation.enqueued.map((item) => ({
      id: item.id,
      type: item.type,
      priority: item.priority,
      score: item.score,
      scheduledFor: formatDateTime(item.scheduledFor)
    }))
  );

  logSection("Processing queue: pre-quiet hours");
  const firstDispatch = queue.processDueNotifications(addMinutes(referenceTime, 20));
  firstDispatch.forEach((notification) => {
    console.log(`${notification.type} dispatched at priority ${notification.priority}`);
  });

  logSection("Processing queue: during quiet hours, expect deferrals");
  const quietTime = new Date("2024-05-20T23:30:00Z");
  const secondDispatch = queue.processDueNotifications(quietTime);
  console.log(`Dispatched count: ${secondDispatch.length}`);

  logSection("Processing queue: post-quiet hours");
  const afterQuiet = new Date("2024-05-21T07:05:00Z");
  const thirdDispatch = queue.processDueNotifications(afterQuiet);
  thirdDispatch.forEach((notification) => {
    console.log(`${notification.type} dispatched with metadata`, notification.metadata);
  });
}

runSimulation().catch((error) => {
  console.error("Simulation failed", error);
  process.exitCode = 1;
});
