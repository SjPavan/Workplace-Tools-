export const defaultConfig = {
  quietHours: {
    start: "22:00",
    end: "07:00",
    timezone: "UTC"
  },
  escalation: {
    maxQueueDelayMinutes: 30,
    escalatePriorityTo: "high",
    channels: ["push"],
    fallbackChannels: ["email"]
  },
  deduplication: {
    windowMinutes: 60
  },
  scoringWeights: {
    calendar: 1.2,
    habit: 1.0,
    mood: 1.5,
    routine: 1.1
  },
  thresholds: {
    minimumNotificationScore: 0.6
  }
};
