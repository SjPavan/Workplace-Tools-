const { createCollectionService } = require('./collectionFactory');
const { toISODate } = require('../utils/dateUtils');

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const habitService = createCollectionService('habits', 'habit', {
  prepareCreate: (payload) => ({
    name: payload.name,
    description: payload.description || '',
    cadence: payload.cadence || 'daily',
    cues: normalizeArray(payload.cues),
    rewards: normalizeArray(payload.rewards),
    streak: payload.streak ?? 0,
    lastPerformed: toISODate(payload.lastPerformed),
    metrics: payload.metrics || {}
  }),
  prepareUpdate: (payload) => {
    const result = {};
    if (payload.name !== undefined) result.name = payload.name;
    if (payload.description !== undefined) result.description = payload.description;
    if (payload.cadence !== undefined) result.cadence = payload.cadence;
    if (payload.cues !== undefined) result.cues = normalizeArray(payload.cues);
    if (payload.rewards !== undefined) result.rewards = normalizeArray(payload.rewards);
    if (payload.streak !== undefined) result.streak = payload.streak;
    if (payload.lastPerformed !== undefined) result.lastPerformed = toISODate(payload.lastPerformed);
    if (payload.metrics !== undefined) result.metrics = payload.metrics;
    return result;
  }
});

module.exports = habitService;
