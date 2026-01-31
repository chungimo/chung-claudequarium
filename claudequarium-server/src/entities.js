const crypto = require('crypto');

// In-memory entity storage
const entities = new Map();

function generateEntityId() {
  return crypto.randomBytes(6).toString('hex');
}

function createEntity(sessionId) {
  const entityId = generateEntityId();
  const entity = {
    entity_id: entityId,
    session_id: sessionId,
    state: 'SPAWNED',
    appearance: {}, // Will be populated in Phase 5
    created_at: Date.now(),
    last_update: Date.now()
  };
  entities.set(entityId, entity);
  return entity;
}

function getEntity(entityId) {
  return entities.get(entityId) || null;
}

function getAllEntities() {
  return Array.from(entities.values());
}

function removeEntity(entityId) {
  const entity = entities.get(entityId);
  if (entity) {
    entities.delete(entityId);
    return true;
  }
  return false;
}

function updateEntityState(entityId, state) {
  const entity = entities.get(entityId);
  if (entity) {
    entity.state = state;
    entity.last_update = Date.now();
    return entity;
  }
  return null;
}

function setEntityWaving(entityId, duration = 3000) {
  const entity = entities.get(entityId);
  if (entity) {
    const waveStartTime = Date.now();
    entity.isWaving = true;
    entity.waveStartTime = waveStartTime;
    entity.waveDuration = duration;
    entity.last_update = waveStartTime;

    // Auto-clear wave state after duration
    setTimeout(() => {
      // Only clear if this is still the same wave (not a new one)
      if (entity.isWaving && entity.waveStartTime === waveStartTime) {
        entity.isWaving = false;
      }
    }, duration);

    return entity;
  }
  return null;
}

module.exports = {
  createEntity,
  getEntity,
  getAllEntities,
  removeEntity,
  updateEntityState,
  setEntityWaving
};
