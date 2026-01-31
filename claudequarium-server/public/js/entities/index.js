// Entity Management
// Main module - re-exports all entity functionality

import { processStateQueue } from './state.js';
import { updatePathFollowing } from './movement.js';
import { updateWandering } from './wandering.js';

// Re-export from submodules
export { createEntity } from './create.js';
export { queueStateChange, processStateQueue } from './state.js';
export { updatePathFollowing, arriveAtDestination } from './movement.js';
export { updateWandering, scheduleNextWander } from './wandering.js';
export { getEntityTile, isEntityAtTile, teleportEntity, cleanupEntity } from './utils.js';

/**
 * Update entity position and state
 * @param {object} entity
 * @param {number} deltaTime - Time since last update in seconds
 */
export function updateEntity(entity, deltaTime) {
  // Process state queue
  processStateQueue(entity);

  // Handle path following
  if (entity.isMoving && entity.path.length > 0) {
    updatePathFollowing(entity, deltaTime);
  }

  // Handle wandering for THINKING/IDLE states
  if (!entity.isMoving && entity.stateQueue.length === 0) {
    updateWandering(entity);
  }

  // Update animation frame
  entity.animationTimer += deltaTime;
  if (entity.animationTimer > 0.3) {
    entity.animationTimer = 0;
    entity.animationFrame = (entity.animationFrame + 1) % 4;
  }
}
