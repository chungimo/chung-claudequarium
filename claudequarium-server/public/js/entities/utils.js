// Entity Utilities
// Helper functions for entity management

import { pixelToTile } from '../mapData.js';
import { clearEntityAssignments } from '../state.js';

/**
 * Get entity's current tile position
 * @param {object} entity
 * @returns {{x: number, y: number}}
 */
export function getEntityTile(entity) {
  return pixelToTile(entity.x, entity.y);
}

/**
 * Check if entity is at a specific tile
 * @param {object} entity
 * @param {number} tileX
 * @param {number} tileY
 * @returns {boolean}
 */
export function isEntityAtTile(entity, tileX, tileY) {
  const tile = getEntityTile(entity);
  return tile.x === tileX && tile.y === tileY;
}

/**
 * Force entity to a specific position (for debugging/teleport)
 * @param {object} entity
 * @param {number} x
 * @param {number} y
 */
export function teleportEntity(entity, x, y) {
  entity.x = x;
  entity.y = y;
  entity.path = [];
  entity.pathIndex = 0;
  entity.isMoving = false;
}

/**
 * Release all resources for an entity
 * @param {object} entity
 */
export function cleanupEntity(entity) {
  clearEntityAssignments(entity.id);
}
