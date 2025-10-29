const { state, createId } = require('../store');

const clone = (entity) => JSON.parse(JSON.stringify(entity));

const createCollectionService = (collectionKey, idPrefix, { prepareCreate, prepareUpdate } = {}) => {
  const list = () => state[collectionKey].map(clone);

  const getById = (id) => {
    const entity = state[collectionKey].find((item) => item.id === id);
    return entity ? clone(entity) : null;
  };

  const create = (payload) => {
    const now = new Date().toISOString();
    const base = {
      id: createId(idPrefix),
      createdAt: now,
      updatedAt: now
    };
    const prepared = prepareCreate ? prepareCreate(payload, base) : payload;
    const entity = {
      ...base,
      ...prepared
    };
    state[collectionKey].push(entity);
    return clone(entity);
  };

  const update = (id, payload) => {
    const index = state[collectionKey].findIndex((item) => item.id === id);
    if (index === -1) return null;

    const entity = state[collectionKey][index];
    const modifications = prepareUpdate ? prepareUpdate(payload, entity) : payload;
    Object.assign(entity, modifications);
    entity.updatedAt = new Date().toISOString();
    return clone(entity);
  };

  const remove = (id) => {
    const index = state[collectionKey].findIndex((item) => item.id === id);
    if (index === -1) return false;
    state[collectionKey].splice(index, 1);
    return true;
  };

  return {
    list,
    getById,
    create,
    update,
    remove
  };
};

module.exports = {
  createCollectionService
};
