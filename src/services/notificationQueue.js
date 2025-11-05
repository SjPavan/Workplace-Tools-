import { defaultConfig } from "../config/defaultConfig.js";
import { addMinutes, getNextQuietHoursExit, isWithinQuietHours } from "../utils/time.js";

let notificationCounter = 0;

function generateNotificationId() {
  notificationCounter += 1;
  return `notif-${notificationCounter}`;
}

function minutesBetween(dateA, dateB) {
  const a = dateA instanceof Date ? dateA : new Date(dateA);
  const b = dateB instanceof Date ? dateB : new Date(dateB);
  return (b.getTime() - a.getTime()) / (60 * 1000);
}

export class NotificationQueue {
  constructor(config = defaultConfig, { fcmClient } = {}) {
    this.config = config;
    this.queue = [];
    this.sentNotifications = [];
    this.fcmClient = fcmClient;
  }

  setFCMClient(client) {
    this.fcmClient = client;
  }

  enqueue(inputNotification) {
    const notification = {
      id: inputNotification.id || generateNotificationId(),
      userId: inputNotification.userId,
      type: inputNotification.type,
      payload: inputNotification.payload,
      priority: inputNotification.priority || "normal",
      createdAt: inputNotification.createdAt
        ? new Date(inputNotification.createdAt)
        : new Date(),
      scheduledFor: inputNotification.scheduledFor
        ? new Date(inputNotification.scheduledFor)
        : new Date(),
      metadata: inputNotification.metadata || {}
    };

    this.applyQuietHours(notification);

    if (this.isDuplicate(notification)) {
      this.mergeDuplicate(notification);
      return notification.id;
    }

    this.queue.push(notification);
    this.queue.sort((a, b) => a.scheduledFor - b.scheduledFor);
    return notification.id;
  }

  isDuplicate(notification) {
    const windowMinutes = this.config.deduplication?.windowMinutes ?? 60;
    const threshold = addMinutes(notification.scheduledFor, windowMinutes * -1);
    return this.queue.some((queued) => {
      if (queued.userId !== notification.userId || queued.type !== notification.type) {
        return false;
      }
      return queued.scheduledFor >= threshold && queued.scheduledFor <= notification.scheduledFor;
    });
  }

  mergeDuplicate(notification) {
    const windowMinutes = this.config.deduplication?.windowMinutes ?? 60;
    const threshold = addMinutes(notification.scheduledFor, windowMinutes * -1);
    this.queue = this.queue.map((queued) => {
      if (queued.userId !== notification.userId || queued.type !== notification.type) {
        return queued;
      }
      if (queued.scheduledFor >= threshold && queued.scheduledFor <= notification.scheduledFor) {
        // Update payload with latest metadata and extend to latest scheduled time
        return {
          ...queued,
          payload: notification.payload,
          metadata: {
            ...queued.metadata,
            ...notification.metadata,
            dedupMerged: true
          },
          scheduledFor: notification.scheduledFor
        };
      }
      return queued;
    });
  }

  applyQuietHours(notification) {
    if (!this.config.quietHours) {
      return;
    }
    const scheduled = notification.scheduledFor;
    if (isWithinQuietHours(scheduled, this.config.quietHours)) {
      const nextExit = getNextQuietHoursExit(scheduled, this.config.quietHours);
      notification.metadata.quietHoursDeferral = true;
      notification.scheduledFor = nextExit;
    }
  }

  processDueNotifications(currentTime = new Date()) {
    const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
    const due = [];
    const remaining = [];

    for (const notification of this.queue) {
      if (notification.scheduledFor <= now) {
        const elapsed = minutesBetween(notification.createdAt, now);
        const withinQuietHours = isWithinQuietHours(now, this.config.quietHours || {});
        if (withinQuietHours) {
          if (
            this.config.escalation &&
            elapsed >= (this.config.escalation.maxQueueDelayMinutes ?? Infinity)
          ) {
            notification.priority = this.config.escalation.escalatePriorityTo || "high";
            notification.metadata.escalated = true;
            due.push(notification);
          } else {
            this.applyQuietHours(notification);
            remaining.push(notification);
          }
        } else {
          due.push(notification);
        }
      } else {
        remaining.push(notification);
      }
    }

    this.queue = remaining.sort((a, b) => a.scheduledFor - b.scheduledFor);

    for (const notification of due) {
      this.dispatch(notification);
    }

    return due;
  }

  dispatch(notification) {
    if (!this.fcmClient) {
      this.sentNotifications.push({
        ...notification,
        dispatchedAt: new Date().toISOString(),
        channel: "queue"
      });
      return;
    }
    const response = this.fcmClient.send(notification);
    this.sentNotifications.push({
      ...notification,
      dispatchedAt: new Date().toISOString(),
      channel: "fcm",
      response
    });
  }
}
