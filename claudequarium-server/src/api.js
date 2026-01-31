// CC Office Server - API Routes

const express = require('express');
const entities = require('./entities');
const websocket = require('./websocket');
const { VALID_STATES } = require('./config');

const router = express.Router();

// Spawn entity
router.post('/spawn', (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }

  const entity = entities.createEntity(session_id);
  console.log(`Entity spawned: ${entity.entity_id} (session: ${session_id})`);

  websocket.broadcast({
    type: 'ENTITY_SPAWNED',
    entity_id: entity.entity_id,
    appearance: entity.appearance
  });

  res.json({
    entity_id: entity.entity_id,
    appearance: entity.appearance
  });
});

// Despawn entity
router.post('/despawn', (req, res) => {
  const { entity_id } = req.body;

  if (!entity_id) {
    return res.status(400).json({ error: 'entity_id is required' });
  }

  const removed = entities.removeEntity(entity_id);

  if (!removed) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  console.log(`Entity despawned: ${entity_id}`);

  websocket.broadcast({
    type: 'ENTITY_DESPAWNED',
    entity_id: entity_id
  });

  res.json({ success: true });
});

// State change
router.post('/state', (req, res) => {
  const { entity_id, state } = req.body;

  if (!entity_id) {
    return res.status(400).json({ error: 'entity_id is required' });
  }

  if (!state) {
    return res.status(400).json({ error: 'state is required' });
  }

  if (!VALID_STATES.includes(state)) {
    return res.status(400).json({ error: `Invalid state. Must be one of: ${VALID_STATES.join(', ')}` });
  }

  const entity = entities.updateEntityState(entity_id, state);

  if (!entity) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  console.log(`Entity state changed: ${entity_id} -> ${state}`);

  websocket.broadcast({
    type: 'ENTITY_STATE',
    entity_id: entity_id,
    state: state,
    timestamp: Date.now()
  });

  res.json({ success: true, state: state });
});

// Wave (temporary animation)
// 3 phases: look up (2s) -> spin (3s) -> look up (2s) = 7s total
router.post('/wave', (req, res) => {
  const { entity_id } = req.body;
  const duration = 7000;

  if (!entity_id) {
    return res.status(400).json({ error: 'entity_id is required' });
  }

  const entity = entities.setEntityWaving(entity_id, duration);

  if (!entity) {
    return res.status(404).json({ error: 'Entity not found' });
  }

  console.log(`Entity waving: ${entity_id}`);

  websocket.broadcast({
    type: 'ENTITY_WAVE',
    entity_id: entity_id,
    duration: duration,
    timestamp: Date.now()
  });

  res.json({ success: true, duration: duration });
});

// List all entities (debug)
router.get('/entities', (req, res) => {
  res.json(entities.getAllEntities());
});

module.exports = router;
