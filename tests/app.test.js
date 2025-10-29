const request = require('supertest');
const { app, morningJob } = require('../src/app');
const { reset } = require('../src/store');
const { toISODate } = require('../src/utils/dateUtils');

describe('Personal productivity API', () => {
  beforeEach(() => {
    reset();
  });

  afterAll(() => {
    if (typeof morningJob.stop === 'function') {
      morningJob.stop();
    }
  });

  const postTask = (payload) => request(app).post('/tasks').send(payload);

  test('health endpoint responds', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('creates tasks with automatic breakdown and prioritization', async () => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const taskResponse = await postTask({
      title: 'Prepare project plan',
      description: 'Draft outline. Review with team. Publish update.',
      dueDate: today,
      priority: 'high',
      estimatedMinutes: 120,
      autoBreakdown: true
    });

    expect(taskResponse.status).toBe(201);
    expect(taskResponse.body.data.subtasks.length).toBeGreaterThan(0);

    await postTask({
      title: 'File expenses',
      dueDate: tomorrow,
      priority: 'medium'
    });

    const prioritized = await request(app).get('/tasks?prioritize=true&includeScores=true');
    expect(prioritized.status).toBe(200);
    const [firstTask] = prioritized.body.data;
    expect(firstTask.priority).toBe('high');
    expect(firstTask).toHaveProperty('priorityScore');
  });

  test('handles task CRUD and subtask operations', async () => {
    const createResponse = await postTask({
      title: 'Deep work session',
      dueDate: new Date(),
      priority: 'high'
    });
    const taskId = createResponse.body.data.id;

    const subtaskResponse = await request(app)
      .post(`/tasks/${taskId}/subtasks`)
      .send({ title: 'Prepare agenda', estimatedMinutes: 30 });

    expect(subtaskResponse.status).toBe(201);
    expect(subtaskResponse.body.data.title).toBe('Prepare agenda');

    const subtaskId = subtaskResponse.body.data.id;
    const updateSubtaskResponse = await request(app)
      .put(`/tasks/${taskId}/subtasks/${subtaskId}`)
      .send({ status: 'completed' });

    expect(updateSubtaskResponse.status).toBe(200);
    expect(updateSubtaskResponse.body.data.status).toBe('completed');

    const breakdownResponse = await request(app).post(`/tasks/${taskId}/breakdown`);
    expect(breakdownResponse.status).toBe(200);
    expect(breakdownResponse.body.data.subtasks.length).toBeGreaterThan(0);

    const deleteSubtask = await request(app).delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    expect(deleteSubtask.status).toBe(204);

    const deleteTask = await request(app).delete(`/tasks/${taskId}`);
    expect(deleteTask.status).toBe(204);
  });

  test('manages routines lifecycle', async () => {
    const create = await request(app)
      .post('/routines')
      .send({ name: 'Morning routine', frequency: 'daily', tasks: ['task_focus'] });
    expect(create.status).toBe(201);

    const list = await request(app).get('/routines');
    expect(list.body.data.length).toBe(1);

    const id = create.body.data.id;
    const fetch = await request(app).get(`/routines/${id}`);
    expect(fetch.status).toBe(200);
    expect(fetch.body.data.name).toBe('Morning routine');

    const update = await request(app)
      .put(`/routines/${id}`)
      .send({ anchorTime: '07:30', frequency: 'weekdays' });
    expect(update.status).toBe(200);
    expect(update.body.data.anchorTime).toBe('07:30');

    const remove = await request(app).delete(`/routines/${id}`);
    expect(remove.status).toBe(204);
  });

  test('manages habits lifecycle', async () => {
    const create = await request(app)
      .post('/habits')
      .send({ name: 'Meditation', cadence: 'daily', cues: ['after breakfast'] });
    expect(create.status).toBe(201);

    const list = await request(app).get('/habits');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);

    const id = create.body.data.id;
    const fetch = await request(app).get(`/habits/${id}`);
    expect(fetch.status).toBe(200);

    const update = await request(app)
      .put(`/habits/${id}`)
      .send({ streak: 5, lastPerformed: new Date() });
    expect(update.status).toBe(200);
    expect(update.body.data.streak).toBe(5);

    const remove = await request(app).delete(`/habits/${id}`);
    expect(remove.status).toBe(204);
  });

  test('manages time blocks lifecycle', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const create = await request(app)
      .post('/time-blocks')
      .send({
        title: 'Design sprint',
        startTime: start,
        endTime: end,
        focusArea: 'Product'
      });
    expect(create.status).toBe(201);

    const list = await request(app).get('/time-blocks');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);

    const id = create.body.data.id;
    const fetch = await request(app).get(`/time-blocks/${id}`);
    expect(fetch.status).toBe(200);

    const update = await request(app)
      .put(`/time-blocks/${id}`)
      .send({ focusArea: 'UX Review' });
    expect(update.status).toBe(200);
    expect(update.body.data.focusArea).toBe('UX Review');

    const remove = await request(app).delete(`/time-blocks/${id}`);
    expect(remove.status).toBe(204);
  });

  test('manages important dates and generates daily summary', async () => {
    const today = new Date();
    const isoToday = toISODate(today);

    const taskResponse = await postTask({
      title: 'Prepare stakeholder update',
      dueDate: today,
      priority: 'high'
    });
    expect(taskResponse.status).toBe(201);

    const importantDateResponse = await request(app)
      .post('/important-dates')
      .send({ name: 'Product launch', date: today, type: 'launch' });
    expect(importantDateResponse.status).toBe(201);

    const listImportant = await request(app).get('/important-dates');
    expect(listImportant.status).toBe(200);
    expect(listImportant.body.data.length).toBe(1);

    const importantDateId = importantDateResponse.body.data.id;
    const fetchImportantDate = await request(app).get(`/important-dates/${importantDateId}`);
    expect(fetchImportantDate.status).toBe(200);
    expect(fetchImportantDate.body.data.name).toBe('Product launch');

    const summaryResponse = await request(app)
      .post('/summary/daily')
      .send({ date: today });
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.data.tasksDueToday.length).toBe(1);
    expect(summaryResponse.body.data.upcomingImportantDates.length).toBe(1);

    const fetchSummary = await request(app).get(`/summary/daily/${isoToday}`);
    expect(fetchSummary.status).toBe(200);
    expect(fetchSummary.body.data.date).toBe(isoToday);

    const summaryList = await request(app).get('/summary');
    expect(summaryList.status).toBe(200);
    expect(summaryList.body.data.length).toBeGreaterThan(0);
  });

  test('tracks moods', async () => {
    const create = await request(app)
      .post('/moods')
      .send({ rating: 4, note: 'Feeling productive', tags: ['work'] });
    expect(create.status).toBe(201);

    const list = await request(app).get('/moods');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);

    const id = create.body.data.id;
    const fetch = await request(app).get(`/moods/${id}`);
    expect(fetch.status).toBe(200);

    const update = await request(app)
      .put(`/moods/${id}`)
      .send({ rating: 5 });
    expect(update.status).toBe(200);
    expect(update.body.data.rating).toBe(5);

    const remove = await request(app).delete(`/moods/${id}`);
    expect(remove.status).toBe(204);
  });

  test('runs scheduling engine and exposes reminders and suggestions', async () => {
    const today = new Date();
    await postTask({
      title: 'Submit quarterly review',
      dueDate: today,
      priority: 'high',
      status: 'in-progress'
    });

    await request(app)
      .post('/habits')
      .send({ name: 'Walk at lunch', cadence: 'daily' });

    const runResponse = await request(app)
      .post('/scheduling/run')
      .send({ date: today });

    expect(runResponse.status).toBe(200);
    expect(runResponse.body.data.reminders.length).toBeGreaterThan(0);
    expect(runResponse.body.data.suggestions.length).toBeGreaterThan(0);

    const isoToday = toISODate(today);
    const reminders = await request(app).get(`/reminders?date=${isoToday}`);
    expect(reminders.body.data[0].date).toBe(isoToday);

    const suggestions = await request(app).get(`/suggestions?date=${isoToday}`);
    expect(suggestions.body.data.length).toBeGreaterThan(0);
  });

  test('background morning job queues summary and suggestions', async () => {
    const date = new Date();
    await postTask({
      title: 'Refine roadmap',
      dueDate: date,
      priority: 'high'
    });

    const jobResponse = await request(app)
      .post('/jobs/morning-summary/run')
      .send({ date });

    expect(jobResponse.status).toBe(200);
    expect(jobResponse.body.data.summary.date).toBe(toISODate(date));
    expect(jobResponse.body.data.suggestions.length).toBeGreaterThan(0);
  });
});
