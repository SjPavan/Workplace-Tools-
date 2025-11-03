const { createCollectionService } = require('./collectionFactory');
const { toISODate } = require('../utils/dateUtils');

const importantDateService = createCollectionService('importantDates', 'importantdate', {
  prepareCreate: (payload) => ({
    name: payload.name,
    type: payload.type || 'general',
    date: toISODate(payload.date),
    notes: payload.notes || ''
  }),
  prepareUpdate: (payload) => {
    const result = {};
    if (payload.name !== undefined) result.name = payload.name;
    if (payload.type !== undefined) result.type = payload.type;
    if (payload.date !== undefined) result.date = toISODate(payload.date);
    if (payload.notes !== undefined) result.notes = payload.notes;
    return result;
  }
});

module.exports = importantDateService;
