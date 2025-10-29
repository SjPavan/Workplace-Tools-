const { state, createId } = require('../store');
const { toISODate, differenceInDays, isSameDay } = require('../utils/dateUtils');
const { computePriorityScore } = require('../utils/prioritization');

const clone = (entity) => JSON.parse(JSON.stringify(entity));

const buildTaskDigest = (task) => ({
  id: task.id,
  title: task.title,
  status: task.status,
  dueDate: task.dueDate,
  priority: task.priority,
  priorityScore: computePriorityScore(task)
});

const generateDailySummary = (dateInput = new Date()) => {
  const isoDate = toISODate(dateInput) || toISODate(new Date());
  const comparisonDate = new Date(`${isoDate}T00:00:00.000Z`);

  const tasksDueToday = state.tasks
    .filter((task) => isSameDay(task.dueDate, isoDate))
    .map(buildTaskDigest);

  const overdueTasks = state.tasks
    .filter((task) => task.dueDate && !['completed', 'cancelled'].includes(task.status))
    .filter((task) => differenceInDays(task.dueDate, comparisonDate) < 0)
    .map(buildTaskDigest);

  const focusRecommendations = state.tasks
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => computePriorityScore(b) - computePriorityScore(a))
    .slice(0, 5)
    .map(buildTaskDigest);

  const summary = {
    id: createId('summary'),
    date: isoDate,
    createdAt: new Date().toISOString(),
    tasksDueToday,
    overdueTasks,
    focusRecommendations,
    routinesToday: state.routines.map((routine) => ({ id: routine.id, name: routine.name, frequency: routine.frequency })),
    upcomingImportantDates: state.importantDates
      .filter((date) => differenceInDays(date.date, comparisonDate) >= 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5)
      .map((entry) => ({ id: entry.id, name: entry.name, type: entry.type, date: entry.date })),
    moodEntries: state.moods.filter((mood) => mood.date === isoDate).map(clone),
    timeBlocks: state.timeBlocks.filter((block) => isSameDay(block.startTime, isoDate)).map(clone),
    suggestions: state.suggestions.filter((item) => item.date === isoDate).map(clone)
  };

  state.summaries = state.summaries.filter((item) => item.date !== isoDate);
  state.summaries.push(summary);

  return clone(summary);
};

const listSummaries = () => state.summaries.map(clone);

const getSummaryByDate = (dateInput) => {
  const isoDate = toISODate(dateInput);
  if (!isoDate) return null;
  const summary = state.summaries.find((item) => item.date === isoDate);
  return summary ? clone(summary) : null;
};

module.exports = {
  generateDailySummary,
  listSummaries,
  getSummaryByDate
};
