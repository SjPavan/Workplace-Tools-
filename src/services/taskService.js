const { state, createId } = require('../store');
const { toDate } = require('../utils/dateUtils');
const { autoBreakdown } = require('../utils/autoBreakdown');
const { prioritizeTasks, computePriorityScore } = require('../utils/prioritization');

const cloneTask = (task) => ({
  ...task,
  subtasks: task.subtasks.map((sub) => ({ ...sub }))
});

const listTasks = ({ prioritize = false, baseDate = new Date(), includeScores = false } = {}) => {
  const tasks = state.tasks.map(cloneTask);
  if (!prioritize) return tasks;
  const prioritized = prioritizeTasks(tasks, baseDate);
  if (includeScores) return prioritized;
  return prioritized.map(({ priorityScore, ...rest }) => rest);
};

const getTaskById = (id) => {
  const task = state.tasks.find((entry) => entry.id === id);
  if (!task) return null;
  return cloneTask(task);
};

const normalizePriority = (priority) => {
  if (!priority) return 'medium';
  const normalized = String(priority).toLowerCase();
  if (['low', 'medium', 'high'].includes(normalized)) {
    return normalized;
  }
  return 'medium';
};

const toISOStringOrNull = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

const persistTask = (task) => {
  task.priorityScore = computePriorityScore(task);
  return task;
};

const createTask = (payload) => {
  const now = new Date().toISOString();
  const task = {
    id: createId('task'),
    title: payload.title,
    description: payload.description || '',
    dueDate: toISOStringOrNull(payload.dueDate),
    priority: normalizePriority(payload.priority),
    status: payload.status || 'pending',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    estimatedMinutes: payload.estimatedMinutes ?? null,
    createdAt: now,
    updatedAt: now,
    subtasks: []
  };

  if (payload.autoBreakdown) {
    task.subtasks = autoBreakdown(task);
  }

  persistTask(task);
  state.tasks.push(task);
  return cloneTask(task);
};

const updateTask = (id, payload) => {
  const index = state.tasks.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  const existing = state.tasks[index];

  if (payload.title !== undefined) existing.title = payload.title;
  if (payload.description !== undefined) existing.description = payload.description;
  if (payload.dueDate !== undefined) existing.dueDate = toISOStringOrNull(payload.dueDate);
  if (payload.priority !== undefined) existing.priority = normalizePriority(payload.priority);
  if (payload.status !== undefined) existing.status = payload.status;
  if (payload.tags !== undefined) existing.tags = Array.isArray(payload.tags) ? payload.tags : existing.tags;
  if (payload.estimatedMinutes !== undefined) existing.estimatedMinutes = payload.estimatedMinutes;
  if (payload.autoBreakdown) {
    existing.subtasks = autoBreakdown(existing);
  }

  existing.updatedAt = new Date().toISOString();
  persistTask(existing);

  return cloneTask(existing);
};

const deleteTask = (id) => {
  const index = state.tasks.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  state.tasks.splice(index, 1);
  return true;
};

const addSubtask = (taskId, payload) => {
  const index = state.tasks.findIndex((entry) => entry.id === taskId);
  if (index === -1) return null;
  const subtask = {
    id: createId('subtask'),
    taskId,
    title: payload.title,
    status: payload.status || 'pending',
    order: payload.order || state.tasks[index].subtasks.length + 1,
    estimatedMinutes: payload.estimatedMinutes ?? null
  };
  state.tasks[index].subtasks.push(subtask);
  state.tasks[index].updatedAt = new Date().toISOString();
  persistTask(state.tasks[index]);
  return { ...subtask };
};

const updateSubtask = (taskId, subtaskId, payload) => {
  const taskIndex = state.tasks.findIndex((entry) => entry.id === taskId);
  if (taskIndex === -1) return null;
  const subtaskIndex = state.tasks[taskIndex].subtasks.findIndex((entry) => entry.id === subtaskId);
  if (subtaskIndex === -1) return null;
  const subtask = state.tasks[taskIndex].subtasks[subtaskIndex];

  if (payload.title !== undefined) subtask.title = payload.title;
  if (payload.status !== undefined) subtask.status = payload.status;
  if (payload.order !== undefined) subtask.order = payload.order;
  if (payload.estimatedMinutes !== undefined) subtask.estimatedMinutes = payload.estimatedMinutes;

  state.tasks[taskIndex].updatedAt = new Date().toISOString();
  persistTask(state.tasks[taskIndex]);

  return { ...subtask };
};

const deleteSubtask = (taskId, subtaskId) => {
  const taskIndex = state.tasks.findIndex((entry) => entry.id === taskId);
  if (taskIndex === -1) return false;
  const subtaskIndex = state.tasks[taskIndex].subtasks.findIndex((entry) => entry.id === subtaskId);
  if (subtaskIndex === -1) return false;
  state.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
  state.tasks[taskIndex].updatedAt = new Date().toISOString();
  persistTask(state.tasks[taskIndex]);
  return true;
};

module.exports = {
  listTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask
};
