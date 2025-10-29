const { createId } = require('../store');

const sanitizeSegments = (segments) =>
  segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const buildSegmentsFromDescription = (description) => {
  if (!description) return [];
  const parts = description
    .replace(/\n+/g, ' ')
    .split(/[.!?]/g);
  return sanitizeSegments(parts);
};

const fallbackSegments = (title) => [
  `Plan: ${title}`,
  `Execute: ${title}`,
  `Review: ${title}`
];

const autoBreakdown = (task) => {
  const { title, description, estimatedMinutes } = task;
  const segments = buildSegmentsFromDescription(description);
  const entries = segments.length > 0 ? segments.slice(0, 5) : fallbackSegments(title);
  const total = entries.length;
  const minutesPerSegment = estimatedMinutes && estimatedMinutes > 0
    ? Math.max(10, Math.round(estimatedMinutes / total))
    : null;

  return entries.map((entry, index) => ({
    id: createId('subtask'),
    taskId: task.id,
    title: entry,
    status: 'pending',
    order: index + 1,
    estimatedMinutes: minutesPerSegment
  }));
};

module.exports = {
  autoBreakdown
};
