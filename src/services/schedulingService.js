const { state, createId } = require('../store');
const { toISODate, isWithinNextDays, differenceInDays } = require('../utils/dateUtils');
const { computePriorityScore } = require('../utils/prioritization');

const clone = (entity) => JSON.parse(JSON.stringify(entity));

const registerEntries = (collectionKey, isoDate, entries) => {
  const timestamp = new Date().toISOString();
  const decorated = entries.map((entry) => ({
    id: createId(collectionKey.slice(0, -1)),
    date: isoDate,
    createdAt: timestamp,
    ...entry
  }));

  state[collectionKey] = state[collectionKey].filter((item) => item.date !== isoDate);
  state[collectionKey].push(...decorated);
  return decorated;
};

const buildTaskReminders = (task, isoDate, baseDate) => {
  if (!task.dueDate) return [];
  if (['completed', 'cancelled'].includes(task.status)) return [];

  const reminders = [];
  if (isWithinNextDays(task.dueDate, baseDate, 2)) {
    const diff = differenceInDays(task.dueDate, baseDate);
    reminders.push({
      type: 'task',
      refId: task.id,
      message: `"${task.title}" is due in ${diff === 0 ? 'today' : `${diff} day(s)`}.`,
      scheduledFor: task.dueDate,
      priorityScore: computePriorityScore(task, baseDate)
    });
  }

  if (task.subtasks.some((sub) => sub.status !== 'completed')) {
    reminders.push({
      type: 'subtask',
      refId: task.id,
      message: `Pick up a subtask for "${task.title}" to keep momentum.`,
      scheduledFor: isoDate,
      priorityScore: computePriorityScore(task, baseDate) - 10
    });
  }

  return reminders;
};

const buildSuggestions = (baseDate) => {
  const suggestions = [];

  state.tasks
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => computePriorityScore(b, baseDate) - computePriorityScore(a, baseDate))
    .slice(0, 3)
    .forEach((task) => {
      suggestions.push({
        type: 'focus',
        refId: task.id,
        message: `Focus block: dedicate time to "${task.title}" today.`,
        priorityScore: computePriorityScore(task, baseDate)
      });
    });

  state.habits.forEach((habit) => {
    suggestions.push({
      type: 'habit',
      refId: habit.id,
      message: `Log progress for habit "${habit.name}" to maintain your streak.`,
      priorityScore: 50
    });
  });

  state.moods
    .filter((entry) => entry.date === toISODate(baseDate))
    .forEach((entry) => {
      suggestions.push({
        type: 'reflection',
        refId: entry.id,
        message: `Reflect on today's mood (${entry.rating}/5) and consider journaling.`,
        priorityScore: 30
      });
    });

  return suggestions;
};

const computeProactivePlan = (currentDate = new Date()) => {
  const isoDate = toISODate(currentDate);
  const baseDate = currentDate instanceof Date ? currentDate : new Date(currentDate);

  const reminders = state.tasks.flatMap((task) => buildTaskReminders(task, isoDate, baseDate));

  state.timeBlocks
    .filter((block) => isWithinNextDays(block.startTime, baseDate, 0))
    .forEach((block) => {
      reminders.push({
        type: 'time-block',
        refId: block.id,
        message: `Time block "${block.title}" starts soon.`,
        scheduledFor: block.startTime,
        priorityScore: 40
      });
    });

  const suggestions = buildSuggestions(baseDate);

  const storedReminders = registerEntries('reminders', isoDate, reminders);
  const storedSuggestions = registerEntries('suggestions', isoDate, suggestions);

  return {
    reminders: storedReminders.map(clone),
    suggestions: storedSuggestions.map(clone)
  };
};

const getReminders = ({ date } = {}) => {
  if (!date) return state.reminders.map(clone);
  return state.reminders.filter((item) => item.date === date).map(clone);
};

const getSuggestions = ({ date } = {}) => {
  if (!date) return state.suggestions.map(clone);
  return state.suggestions.filter((item) => item.date === date).map(clone);
};

module.exports = {
  computeProactivePlan,
  getReminders,
  getSuggestions
};
