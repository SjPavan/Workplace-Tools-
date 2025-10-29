const { createCollectionService } = require('./collectionFactory');
const { toISODate } = require('../utils/dateUtils');

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const moodService = createCollectionService('moods', 'mood', {
  prepareCreate: (payload) => ({
    date: toISODate(payload.date) || toISODate(new Date()),
    rating: payload.rating ?? null,
    note: payload.note || '',
    energyLevel: payload.energyLevel || null,
    tags: normalizeArray(payload.tags)
  }),
  prepareUpdate: (payload) => {
    const result = {};
    if (payload.date !== undefined) result.date = toISODate(payload.date);
    if (payload.rating !== undefined) result.rating = payload.rating;
    if (payload.note !== undefined) result.note = payload.note;
    if (payload.energyLevel !== undefined) result.energyLevel = payload.energyLevel;
    if (payload.tags !== undefined) result.tags = normalizeArray(payload.tags);
    return result;
  }
});

module.exports = moodService;
