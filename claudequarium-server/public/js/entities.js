// Entity Management
// Re-exports from modular entities structure for backwards compatibility

export {
  createEntity,
  queueStateChange,
  processStateQueue,
  updateEntity,
  updatePathFollowing,
  arriveAtDestination,
  updateWandering,
  scheduleNextWander,
  getEntityTile,
  isEntityAtTile,
  teleportEntity,
  cleanupEntity
} from './entities/index.js';
