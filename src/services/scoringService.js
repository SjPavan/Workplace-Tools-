import { defaultConfig } from "../config/defaultConfig.js";

function minutesUntil(referenceIso, targetDate) {
  const reference = new Date(referenceIso);
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  return (target.getTime() - reference.getTime()) / (60 * 1000);
}

export class ScoringService {
  constructor(config = defaultConfig) {
    this.config = config;
    this.weights = config.scoringWeights || {};
  }

  buildCalendarSuggestion(aggregated) {
    const event = aggregated.nextCalendarEvent;
    if (!event) {
      return null;
    }
    const minutesToEvent = minutesUntil(aggregated.referenceTime, event.startDate);
    if (Number.isNaN(minutesToEvent) || minutesToEvent < 0) {
      return null;
    }
    const urgencyScore = Math.max(0, 1 - minutesToEvent / 180);
    const importance = event.importance === "high" ? 1 : 0;
    const baseScore = (urgencyScore + importance * 0.5) * (this.weights.calendar || 1);
    if (baseScore <= 0) {
      return null;
    }
    return {
      type: "calendar_preparation",
      score: Number(baseScore.toFixed(3)),
      message: `Get ready for ${event.title} at ${event.startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.`,
      metadata: {
        eventId: event.id,
        startsInMinutes: Math.round(minutesToEvent)
      }
    };
  }

  buildHabitSuggestions(aggregated) {
    return aggregated.overdueHabits
      .map((habit) => {
        const streakBoost = Math.min(habit.streak ?? 0, 5) * 0.05;
        const score = (0.7 + streakBoost) * (this.weights.habit || 1);
        if (score <= 0) {
          return null;
        }
        return {
          type: "habit_reminder",
          score: Number(score.toFixed(3)),
          message: `Time to check in on "${habit.name}" to protect your streak.`,
          metadata: {
            habitName: habit.name,
            scheduledFor: habit.scheduledFor
          }
        };
      })
      .filter(Boolean);
  }

  buildMoodSuggestion(aggregated) {
    const { mood } = aggregated;
    if (!mood || mood.latest == null) {
      return null;
    }
    const latestScore = mood.latest.score ?? mood.latest.moodLevel ?? 3;
    const averageScore = mood.average ?? latestScore;
    const trendPenalty = mood.trend === "declining" ? 0.4 : mood.trend === "improving" ? -0.2 : 0;
    const deficit = Math.max(0, 3.5 - averageScore);
    const baseScore = (deficit * 0.4 + trendPenalty) * (this.weights.mood || 1);
    if (baseScore <= 0.3) {
      return null;
    }
    return {
      type: "mood_check_in",
      score: Number(baseScore.toFixed(3)),
      message: "Mood trending low. Want a quick reflection exercise?",
      metadata: {
        trend: mood.trend,
        latestScore
      }
    };
  }

  buildRoutineSuggestion(aggregated, pipelineSignals) {
    const forecast = pipelineSignals.routineForecast || {};
    const readiness = forecast.readinessScore ?? 0;
    if (readiness <= 0.2) {
      return null;
    }
    const score = readiness * (this.weights.routine || 1);
    return {
      type: "routine_suggestion",
      score: Number(score.toFixed(3)),
      message: forecast.suggestion ?? "Consider starting a focused session now.",
      metadata: forecast.metadata || {}
    };
  }

  rankSuggestions(aggregated, pipelineSignals = {}) {
    const suggestions = [];
    const calendarSuggestion = this.buildCalendarSuggestion(aggregated);
    if (calendarSuggestion) {
      suggestions.push(calendarSuggestion);
    }
    const habitSuggestions = this.buildHabitSuggestions(aggregated);
    suggestions.push(...habitSuggestions);
    const moodSuggestion = this.buildMoodSuggestion(aggregated);
    if (moodSuggestion) {
      suggestions.push(moodSuggestion);
    }
    const routineSuggestion = this.buildRoutineSuggestion(aggregated, pipelineSignals);
    if (routineSuggestion) {
      suggestions.push(routineSuggestion);
    }

    return suggestions
      .filter((suggestion) => suggestion.score >= (this.config.thresholds?.minimumNotificationScore || 0))
      .sort((a, b) => b.score - a.score);
  }
}
