import { addMinutes } from "../utils/time.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function forecastMoodScore(moodEntries = []) {
  if (!moodEntries.length) {
    return {
      expectedMood: 3,
      confidence: 0
    };
  }
  const sorted = [...moodEntries].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const scores = sorted.map((entry) => entry.score ?? entry.moodLevel ?? 3);
  const latest = scores[scores.length - 1];
  if (scores.length === 1) {
    return {
      expectedMood: latest,
      confidence: 0.2
    };
  }
  const deltas = [];
  for (let i = 1; i < scores.length; i += 1) {
    deltas.push(scores[i] - scores[i - 1]);
  }
  const trend = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  const forecast = clamp(latest + trend * 0.8, 1, 5);
  const variance = scores.reduce((sum, value) => sum + (value - latest) ** 2, 0) / scores.length;
  const confidence = clamp(1 - variance / 4, 0, 1);
  return {
    expectedMood: forecast,
    confidence
  };
}

function findFocusWindow(aggregated, minimumMinutes = 45) {
  const reference = new Date(aggregated.referenceTime);
  const events = aggregated.upcomingEvents || [];
  let cursor = reference;
  for (const event of events) {
    const start = event.startDate;
    if (!start) {
      continue;
    }
    const diffMinutes = (start.getTime() - cursor.getTime()) / (60 * 1000);
    if (diffMinutes >= minimumMinutes) {
      return {
        start: cursor,
        end: start,
        minutes: diffMinutes
      };
    }
    cursor = event.endDate || start;
  }
  // No blocking events ahead -> open window until end of day
  const endOfDay = new Date(reference);
  endOfDay.setUTCHours(23, 59, 0, 0);
  const diffMinutes = (endOfDay.getTime() - cursor.getTime()) / (60 * 1000);
  return {
    start: cursor,
    end: endOfDay,
    minutes: diffMinutes
  };
}

export class RuleBasedForecastPipeline {
  constructor(options = {}) {
    this.minimumFocusMinutes = options.minimumFocusMinutes || 45;
  }

  generateSignals(aggregatedContext) {
    const forecast = forecastMoodScore(aggregatedContext.rawContext.moodEntries);
    const focusWindow = findFocusWindow(
      aggregatedContext,
      this.minimumFocusMinutes
    );
    const readinessFromMood = (forecast.expectedMood - 2) / 3; // range approx 0-1
    const windowScore = clamp(focusWindow.minutes / 90, 0, 1);
    const habitPenalty = clamp(aggregatedContext.overdueHabits.length * 0.1, 0, 0.4);
    const readinessScore = clamp(
      readinessFromMood * 0.5 + windowScore * 0.5 - habitPenalty,
      0,
      1
    );

    let suggestion;
    if (readinessScore > 0.7) {
      suggestion = "Great window ahead. Kick off a focus block now?";
    } else if (readinessScore > 0.45) {
      suggestion = "Upcoming window looks decent. Plan a short routine?";
    } else if (readinessScore > 0.25) {
      suggestion = "Energy is moderate. Maybe review tomorrow's plan.";
    }

    return {
      moodForecast: forecast,
      routineForecast: {
        readinessScore: Number(readinessScore.toFixed(3)),
        suggestion,
        metadata: {
          focusWindowStart: focusWindow.start.toISOString(),
          focusWindowEnd: focusWindow.end.toISOString(),
          focusWindowMinutes: Math.round(focusWindow.minutes)
        }
      }
    };
  }
}
