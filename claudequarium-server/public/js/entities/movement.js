// Entity Movement
// Handles path following and movement updates

import { MOVE_SPEED, PATH_ARRIVAL_THRESHOLD, WANDER_MIN_DELAY_MS, WANDER_MAX_DELAY_MS } from '../config.js';
import { getDirection, facingToDirection } from '../pathfinding.js';
import { getZoneById } from '../mapData.js';

/**
 * Update entity position along its path
 * @param {object} entity
 * @param {number} deltaTime
 */
export function updatePathFollowing(entity, deltaTime) {
  if (entity.pathIndex >= entity.path.length) {
    arriveAtDestination(entity);
    return;
  }

  const target = entity.path[entity.pathIndex];
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < PATH_ARRIVAL_THRESHOLD) {
    // Reached waypoint, advance to next
    entity.pathIndex++;

    if (entity.pathIndex >= entity.path.length) {
      arriveAtDestination(entity);
    }
    return;
  }

  // Move toward waypoint (use entity's current speed)
  const speed = entity.currentSpeed || MOVE_SPEED;
  const moveDistance = speed * deltaTime;
  const ratio = Math.min(moveDistance / distance, 1);

  entity.x += dx * ratio;
  entity.y += dy * ratio;

  // Update direction based on movement
  entity.direction = getDirection(entity.x - dx * ratio, entity.y - dy * ratio, entity.x, entity.y);
}

/**
 * Handle arrival at destination
 * @param {object} entity
 */
export function arriveAtDestination(entity) {
  // Snap to exact zone center (not tile center) for precise positioning
  if (entity.targetZone) {
    entity.x = entity.targetZone.centerX;
    entity.y = entity.targetZone.centerY;
  } else if (entity.path.length > 0) {
    // Fallback to path's final point if no target zone
    const finalPoint = entity.path[entity.path.length - 1];
    entity.x = finalPoint.x;
    entity.y = finalPoint.y;
  }

  entity.isMoving = false;
  entity.visualState = entity.targetState;
  entity.currentStateStartTime = Date.now();

  // Set facing direction based on zone
  if (entity.targetZone && entity.targetZone.facing) {
    const direction = facingToDirection(entity.targetZone.facing);
    if (direction) {
      entity.direction = direction;
    }
  }

  // Initialize wandering for THINKING/IDLE states
  if (entity.visualState === 'THINKING' || entity.visualState === 'IDLE') {
    // Store the zone for wandering (use original zone, not the random point version)
    if (entity.targetZone) {
      entity.wanderZone = getZoneById(entity.targetZone.id) || entity.targetZone;
    }
    // Schedule first wander
    const delay = WANDER_MIN_DELAY_MS + Math.random() * (WANDER_MAX_DELAY_MS - WANDER_MIN_DELAY_MS);
    entity.nextWanderTime = Date.now() + delay;
  } else {
    entity.wanderZone = null;
  }

  // Clear path data
  entity.path = [];
  entity.pathIndex = 0;
  entity.targetState = null;
  entity.targetZone = null;

  console.log(`Entity ${entity.id} arrived, now in state ${entity.visualState}, facing ${entity.direction}`);
}
