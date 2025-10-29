import { defaultConfig } from "../config/defaultConfig.js";
import { ContextAggregator } from "./contextAggregator.js";
import { ScoringService } from "./scoringService.js";
import { NotificationQueue } from "./notificationQueue.js";
import { RuleBasedForecastPipeline } from "../pipelines/ruleBasedForecastPipeline.js";
import { addMinutes } from "../utils/time.js";

export class ProactiveIntelligenceService {
  constructor({
    config = defaultConfig,
    aggregator,
    scoringService,
    pipeline,
    notificationQueue
  } = {}) {
    this.config = config;
    this.aggregator = aggregator || new ContextAggregator(config);
    this.scoringService = scoringService || new ScoringService(config);
    this.pipeline = pipeline || new RuleBasedForecastPipeline();
    this.notificationQueue = notificationQueue || new NotificationQueue(config);
  }

  evaluate(userContext, options = {}) {
    const referenceTime = options.referenceTime
      ? new Date(options.referenceTime)
      : new Date();
    const aggregated = this.aggregator.aggregate(userContext, referenceTime);
    const pipelineSignals = this.pipeline.generateSignals(aggregated);
    const suggestions = this.scoringService.rankSuggestions(
      aggregated,
      pipelineSignals
    );

    const enqueued = suggestions.map((suggestion) =>
      this.scheduleSuggestion(userContext, aggregated, suggestion, pipelineSignals)
    );

    return {
      aggregated,
      pipelineSignals,
      suggestions,
      enqueued
    };
  }

  scheduleSuggestion(userContext, aggregated, suggestion, pipelineSignals) {
    const referenceDate = new Date(aggregated.referenceTime);
    let scheduledFor = new Date(referenceDate);
    let priority = "normal";

    if (suggestion.type === "calendar_preparation") {
      const startsIn = suggestion.metadata.startsInMinutes;
      if (Number.isFinite(startsIn)) {
        const lead = Math.min(Math.max(startsIn - 15, 2), startsIn);
        scheduledFor = addMinutes(referenceDate, Math.max(lead, 2));
        if (startsIn <= 30) {
          priority = "high";
        }
      }
    } else if (suggestion.type === "habit_reminder") {
      scheduledFor = suggestion.metadata.scheduledFor
        ? new Date(suggestion.metadata.scheduledFor)
        : addMinutes(referenceDate, 5);
    } else if (suggestion.type === "routine_suggestion") {
      const start = pipelineSignals?.routineForecast?.metadata?.focusWindowStart;
      scheduledFor = start ? new Date(start) : addMinutes(referenceDate, 3);
    } else if (suggestion.type === "mood_check_in") {
      scheduledFor = addMinutes(referenceDate, 1);
      priority = "high";
    }

    const notificationPayload = {
      type: suggestion.type,
      title: this.getNotificationTitle(suggestion.type),
      body: suggestion.message,
      data: {
        userId: userContext.userId,
        ...suggestion.metadata
      }
    };

    const notification = {
      userId: userContext.userId,
      type: suggestion.type,
      payload: notificationPayload,
      priority,
      scheduledFor,
      metadata: {
        score: suggestion.score,
        strategy: "proactive-intelligence"
      }
    };

    const id = this.notificationQueue.enqueue(notification);
    return {
      id,
      type: suggestion.type,
      scheduledFor: notification.scheduledFor,
      priority,
      score: suggestion.score
    };
  }

  getNotificationTitle(type) {
    switch (type) {
      case "calendar_preparation":
        return "Upcoming meeting";
      case "habit_reminder":
        return "Habit check-in";
      case "mood_check_in":
        return "Quick mood check";
      case "routine_suggestion":
        return "Routine suggestion";
      default:
        return "Proactive suggestion";
    }
  }
}
