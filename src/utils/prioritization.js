const { differenceInDays, toDate } = require('./dateUtils');

const PRIORITY_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1
};

const STATUS_WEIGHT = {
  completed: -2,
  cancelled: -3
};

const computePriorityScore = (task, baseDate = new Date()) => {
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] ?? 1;
  let score = priorityWeight * 100;

  const taskStatusWeight = STATUS_WEIGHT[task.status];
  if (taskStatusWeight) {
    score += taskStatusWeight * 50;
  }

  const dueDate = toDate(task.dueDate);
  if (dueDate) {
    const diff = differenceInDays(dueDate, baseDate);
    if (diff !== null) {
      if (diff < 0) {
        score += 120 + Math.abs(diff) * 5;
      } else {
        score += Math.max(0, 60 - diff * 4);
      }
    }
  }

  if (task.estimatedMinutes) {
    score += Math.min(30, Math.round(task.estimatedMinutes / 15));
  }

  return score;
};

const prioritizeTasks = (tasks, baseDate = new Date()) => {
  return [...tasks]
    .map((task) => ({
      ...task,
      priorityScore: computePriorityScore(task, baseDate)
    }))
    .sort((a, b) => {
      if (b.priorityScore === a.priorityScore) {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDue - bDue;
      }
      return b.priorityScore - a.priorityScore;
    });
};

module.exports = {
  computePriorityScore,
  prioritizeTasks
};
