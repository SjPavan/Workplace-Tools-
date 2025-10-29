const { createCollectionService } = require('./collectionFactory');

const normalizeTasks = (tasks) => (Array.isArray(tasks) ? tasks : []);

const routineService = createCollectionService('routines', 'routine', {
  prepareCreate: (payload) => ({
    name: payload.name,
    description: payload.description || '',
    frequency: payload.frequency || 'daily',
    anchorTime: payload.anchorTime || null,
    tasks: normalizeTasks(payload.tasks)
  }),
  prepareUpdate: (payload) => {
    const result = {};
    if (payload.name !== undefined) result.name = payload.name;
    if (payload.description !== undefined) result.description = payload.description;
    if (payload.frequency !== undefined) result.frequency = payload.frequency;
    if (payload.anchorTime !== undefined) result.anchorTime = payload.anchorTime;
    if (payload.tasks !== undefined) result.tasks = normalizeTasks(payload.tasks);
    return result;
  }
});

module.exports = routineService;
