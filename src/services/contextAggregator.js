import { addMinutes } from "../utils/time.js";

function parseDate(input) {
  return input instanceof Date ? input : new Date(input);
}

function calculateHabitDue(habit, referenceTime) {
  if (!habit.lastCompletedAt) {
    return true;
  }
  const lastCompleted = parseDate(habit.lastCompletedAt);
  const cadence = habit.cadence || "daily";
  const diffMs = referenceTime.getTime() - lastCompleted.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (cadence === "daily") {
    return diffHours >= 20; // allow some slack before reminding again
  }
  if (cadence === "weekly") {
    return diffHours >= 24 * 6.5;
  }
  if (cadence === "monthly") {
    return diffHours >= 24 * 27;
  }
  return diffHours >= 12;
}

function toUpcomingHabit(habit, referenceTime) {
  const due = calculateHabitDue(habit, referenceTime);
  const preferredTime = habit.preferredTime || "08:00";
  const windowMinutes = habit.reminderWindowMinutes || 90;
  let scheduledFor = referenceTime;
  if (due) {
    const [hours, minutes] = preferredTime.split(":").map(Number);
    scheduledFor = new Date(referenceTime);
    scheduledFor.setUTCHours(hours, minutes, 0, 0);
    if (scheduledFor < referenceTime) {
      scheduledFor = addMinutes(scheduledFor, windowMinutes);
    }
  }
  return {
    name: habit.name,
    due,
    streak: habit.streak ?? 0,
    priority: habit.priority || "normal",
    scheduledFor: scheduledFor.toISOString()
  };
}

function computeMoodTrend(moodEntries = []) {
  if (moodEntries.length === 0) {
    return {
      average: null,
      latest: null,
      trend: "stable"
    };
  }
  const sorted = [...moodEntries].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const scores = sorted.map((entry) => entry.score ?? entry.moodLevel ?? 3);
  const latest = sorted[sorted.length - 1];
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  let trend = "stable";
  if (scores.length >= 3) {
    const recent = scores.slice(-3);
    const deltas = [recent[1] - recent[0], recent[2] - recent[1]];
    const avgDelta = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
    if (avgDelta > 0.3) {
      trend = "improving";
    } else if (avgDelta < -0.3) {
      trend = "declining";
    }
  }
  return {
    average,
    latest,
    trend
  };
}

export class ContextAggregator {
  aggregate(userContext, reference = new Date()) {
    const referenceTime = reference instanceof Date ? reference : new Date(reference);
    const calendarEvents = Array.isArray(userContext.calendarEvents)
      ? [...userContext.calendarEvents]
      : [];
    const habits = Array.isArray(userContext.habits) ? [...userContext.habits] : [];
    const moodEntries = Array.isArray(userContext.moodEntries)
      ? [...userContext.moodEntries]
      : [];

    const upcomingEvents = calendarEvents
      .map((event) => ({
        ...event,
        startDate: parseDate(event.start),
        endDate: parseDate(event.end || event.start)
      }))
      .filter((event) => event.startDate >= referenceTime)
      .sort((a, b) => a.startDate - b.startDate);

    const nextCalendarEvent = upcomingEvents[0] || null;

    const upcomingHabits = habits
      .map((habit) => toUpcomingHabit(habit, referenceTime))
      .filter(Boolean);

    const overdueHabits = upcomingHabits.filter((habit) => habit.due);

    const mood = computeMoodTrend(moodEntries);

    return {
      userId: userContext.userId,
      referenceTime: referenceTime.toISOString(),
      nextCalendarEvent,
      upcomingEvents,
      upcomingHabits,
      overdueHabits,
      mood,
      rawContext: {
        calendarEvents,
        habits,
        moodEntries
      }
    };
  }
}
