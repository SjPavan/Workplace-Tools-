const { createCollectionService } = require('./collectionFactory');
const { toDate } = require('../utils/dateUtils');

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const toISOString = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

const timeBlockService = createCollectionService('timeBlocks', 'timeblock', {
  prepareCreate: (payload) => ({
    title: payload.title,
    startTime: toISOString(payload.startTime),
    endTime: toISOString(payload.endTime),
    tasks: normalizeArray(payload.tasks),
    focusArea: payload.focusArea || null
  }),
  prepareUpdate: (payload) => {
    const result = {};
    if (payload.title !== undefined) result.title = payload.title;
    if (payload.startTime !== undefined) result.startTime = toISOString(payload.startTime);
    if (payload.endTime !== undefined) result.endTime = toISOString(payload.endTime);
    if (payload.tasks !== undefined) result.tasks = normalizeArray(payload.tasks);
    if (payload.focusArea !== undefined) result.focusArea = payload.focusArea;
    return result;
  }
});

module.exports = timeBlockService;
