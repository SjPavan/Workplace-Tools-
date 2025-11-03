const { randomUUID } = require('crypto');

const initial = () => ({
  tasks: [],
  routines: [],
  habits: [],
  timeBlocks: [],
  importantDates: [],
  moods: [],
  reminders: [],
  suggestions: [],
  summaries: []
});

const state = initial();

const createId = (prefix) => `${prefix}_${randomUUID()}`;

const reset = () => {
  const fresh = initial();
  Object.keys(fresh).forEach((key) => {
    state[key] = fresh[key];
  });
};

module.exports = {
  state,
  createId,
  reset
};
