const express = require('express');
const taskService = require('./services/taskService');
const routineService = require('./services/routineService');
const habitService = require('./services/habitService');
const timeBlockService = require('./services/timeBlockService');
const importantDateService = require('./services/importantDateService');
const moodService = require('./services/moodService');
const schedulingService = require('./services/schedulingService');
const summaryService = require('./services/summaryService');
const MorningSummaryJob = require('./jobs/morningSummaryJob');
const { toDate, toISODate } = require('./utils/dateUtils');

const app = express();
app.use(express.json());

const morningJob = new MorningSummaryJob({
  summaryService,
  schedulingService
});

const ok = (res, data, status = 200) => res.status(status).json({ data });
const created = (res, data) => ok(res, data, 201);
const notFound = (res, message = 'Not found') => res.status(404).json({ error: message });
const badRequest = (res, message) => res.status(400).json({ error: message });

const parseDateOrNow = (value) => {
  const parsed = value ? toDate(value) : new Date();
  return parsed || new Date();
};

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Tasks
app.get('/tasks', (req, res) => {
  const prioritize = req.query.prioritize === 'true';
  const includeScores = req.query.includeScores === 'true';
  const tasks = taskService.listTasks({ prioritize, includeScores });
  ok(res, tasks);
});

app.post('/tasks', (req, res) => {
  if (!req.body || !req.body.title) {
    return badRequest(res, 'title is required');
  }
  const task = taskService.createTask(req.body);
  return created(res, task);
});

app.get('/tasks/:id', (req, res) => {
  const task = taskService.getTaskById(req.params.id);
  if (!task) return notFound(res, 'Task not found');
  return ok(res, task);
});

app.put('/tasks/:id', (req, res) => {
  const task = taskService.updateTask(req.params.id, req.body || {});
  if (!task) return notFound(res, 'Task not found');
  return ok(res, task);
});

app.delete('/tasks/:id', (req, res) => {
  const deleted = taskService.deleteTask(req.params.id);
  if (!deleted) return notFound(res, 'Task not found');
  return res.status(204).send();
});

app.post('/tasks/:id/breakdown', (req, res) => {
  const task = taskService.updateTask(req.params.id, { autoBreakdown: true });
  if (!task) return notFound(res, 'Task not found');
  return ok(res, task);
});

app.post('/tasks/:id/subtasks', (req, res) => {
  if (!req.body || !req.body.title) {
    return badRequest(res, 'title is required');
  }
  const subtask = taskService.addSubtask(req.params.id, req.body);
  if (!subtask) return notFound(res, 'Task not found');
  return created(res, subtask);
});

app.put('/tasks/:taskId/subtasks/:subtaskId', (req, res) => {
  const subtask = taskService.updateSubtask(req.params.taskId, req.params.subtaskId, req.body || {});
  if (!subtask) return notFound(res, 'Subtask not found');
  return ok(res, subtask);
});

app.delete('/tasks/:taskId/subtasks/:subtaskId', (req, res) => {
  const deleted = taskService.deleteSubtask(req.params.taskId, req.params.subtaskId);
  if (!deleted) return notFound(res, 'Subtask not found');
  return res.status(204).send();
});

// Routines
app.get('/routines', (_, res) => ok(res, routineService.list()));

app.post('/routines', (req, res) => {
  if (!req.body || !req.body.name) {
    return badRequest(res, 'name is required');
  }
  const routine = routineService.create(req.body);
  return created(res, routine);
});

app.get('/routines/:id', (req, res) => {
  const routine = routineService.getById(req.params.id);
  if (!routine) return notFound(res, 'Routine not found');
  return ok(res, routine);
});

app.put('/routines/:id', (req, res) => {
  const routine = routineService.update(req.params.id, req.body || {});
  if (!routine) return notFound(res, 'Routine not found');
  return ok(res, routine);
});

app.delete('/routines/:id', (req, res) => {
  const deleted = routineService.remove(req.params.id);
  if (!deleted) return notFound(res, 'Routine not found');
  return res.status(204).send();
});

// Habits
app.get('/habits', (_, res) => ok(res, habitService.list()));

app.post('/habits', (req, res) => {
  if (!req.body || !req.body.name) {
    return badRequest(res, 'name is required');
  }
  const habit = habitService.create(req.body);
  return created(res, habit);
});

app.get('/habits/:id', (req, res) => {
  const habit = habitService.getById(req.params.id);
  if (!habit) return notFound(res, 'Habit not found');
  return ok(res, habit);
});

app.put('/habits/:id', (req, res) => {
  const habit = habitService.update(req.params.id, req.body || {});
  if (!habit) return notFound(res, 'Habit not found');
  return ok(res, habit);
});

app.delete('/habits/:id', (req, res) => {
  const deleted = habitService.remove(req.params.id);
  if (!deleted) return notFound(res, 'Habit not found');
  return res.status(204).send();
});

// Time blocks
app.get('/time-blocks', (_, res) => ok(res, timeBlockService.list()));

app.post('/time-blocks', (req, res) => {
  if (!req.body || !req.body.title) {
    return badRequest(res, 'title is required');
  }
  const block = timeBlockService.create(req.body);
  return created(res, block);
});

app.get('/time-blocks/:id', (req, res) => {
  const block = timeBlockService.getById(req.params.id);
  if (!block) return notFound(res, 'Time block not found');
  return ok(res, block);
});

app.put('/time-blocks/:id', (req, res) => {
  const block = timeBlockService.update(req.params.id, req.body || {});
  if (!block) return notFound(res, 'Time block not found');
  return ok(res, block);
});

app.delete('/time-blocks/:id', (req, res) => {
  const deleted = timeBlockService.remove(req.params.id);
  if (!deleted) return notFound(res, 'Time block not found');
  return res.status(204).send();
});

// Important dates
app.get('/important-dates', (_, res) => ok(res, importantDateService.list()));

app.post('/important-dates', (req, res) => {
  if (!req.body || !req.body.name) {
    return badRequest(res, 'name is required');
  }
  if (!req.body.date) {
    return badRequest(res, 'date is required');
  }
  const importantDate = importantDateService.create(req.body);
  return created(res, importantDate);
});

app.get('/important-dates/:id', (req, res) => {
  const importantDate = importantDateService.getById(req.params.id);
  if (!importantDate) return notFound(res, 'Important date not found');
  return ok(res, importantDate);
});

app.put('/important-dates/:id', (req, res) => {
  const importantDate = importantDateService.update(req.params.id, req.body || {});
  if (!importantDate) return notFound(res, 'Important date not found');
  return ok(res, importantDate);
});

app.delete('/important-dates/:id', (req, res) => {
  const deleted = importantDateService.remove(req.params.id);
  if (!deleted) return notFound(res, 'Important date not found');
  return res.status(204).send();
});

// Moods
app.get('/moods', (_, res) => ok(res, moodService.list()));

app.post('/moods', (req, res) => {
  const mood = moodService.create(req.body || {});
  return created(res, mood);
});

app.get('/moods/:id', (req, res) => {
  const mood = moodService.getById(req.params.id);
  if (!mood) return notFound(res, 'Mood entry not found');
  return ok(res, mood);
});

app.put('/moods/:id', (req, res) => {
  const mood = moodService.update(req.params.id, req.body || {});
  if (!mood) return notFound(res, 'Mood entry not found');
  return ok(res, mood);
});

app.delete('/moods/:id', (req, res) => {
  const deleted = moodService.remove(req.params.id);
  if (!deleted) return notFound(res, 'Mood entry not found');
  return res.status(204).send();
});

// Scheduling and suggestions
app.post('/scheduling/run', (req, res) => {
  const date = req.body ? req.body.date : undefined;
  const runDate = parseDateOrNow(date);
  const plan = schedulingService.computeProactivePlan(runDate);
  return ok(res, plan);
});

app.get('/reminders', (req, res) => {
  const { date } = req.query;
  const reminders = schedulingService.getReminders({ date });
  return ok(res, reminders);
});

app.get('/suggestions', (req, res) => {
  const { date } = req.query;
  const suggestions = schedulingService.getSuggestions({ date });
  return ok(res, suggestions);
});

// Summary
app.post('/summary/daily', (req, res) => {
  const date = req.body ? req.body.date : undefined;
  const summary = summaryService.generateDailySummary(date ? parseDateOrNow(date) : new Date());
  return ok(res, summary);
});

app.get('/summary/daily/:date', (req, res) => {
  const isoDate = toISODate(req.params.date);
  if (!isoDate) return badRequest(res, 'Invalid date');
  const summary = summaryService.getSummaryByDate(isoDate);
  if (!summary) return notFound(res, 'Summary not found');
  return ok(res, summary);
});

app.get('/summary', (_, res) => {
  const summaries = summaryService.listSummaries();
  return ok(res, summaries);
});

// Background job trigger
app.post('/jobs/morning-summary/run', (req, res) => {
  const date = req.body ? req.body.date : undefined;
  const result = morningJob.run(parseDateOrNow(date));
  return ok(res, result);
});

module.exports = {
  app,
  morningJob
};
