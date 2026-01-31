// State Queue Management
// Handles entity state transitions and queue processing

import { MIN_STATE_DISPLAY_MS, MOVE_SPEED } from '../config.js';
import { assignWorkstation, releaseWorkstation, getEntityWorkstation } from '../state.js';
import { getZonesForState, getRandomPointInZone } from '../mapData.js';
import { findPath, smoothPath } from '../pathfinding.js';

/**
 * Queue a state change for an entity
 * @param {object} entity
 * @param {string} newState
 */
export function queueStateChange(entity, newState) {
  entity.stateQueue.push({
    state: newState,
    queuedAt: Date.now()
  });
  console.log(`Queued state ${newState} for entity ${entity.id}`);
}

/**
 * Process the state queue and initiate movement if needed
 * @param {object} entity
 */
export function processStateQueue(entity) {
  // Don't process if currently moving
  if (entity.isMoving) return;

  // Check minimum display time
  if (entity.currentStateStartTime) {
    const elapsed = Date.now() - entity.currentStateStartTime;
    if (elapsed < MIN_STATE_DISPLAY_MS && entity.stateQueue.length > 0) {
      return;
    }
  }

  if (entity.stateQueue.length === 0) return;

  // Collapse redundant consecutive states
  while (entity.stateQueue.length > 1 &&
         entity.stateQueue[0].state === entity.stateQueue[1].state) {
    entity.stateQueue.shift();
  }

  const nextStateInfo = entity.stateQueue.shift();
  const nextState = nextStateInfo.state;

  // Skip if already in this state and not moving
  if (nextState === entity.visualState && !entity.isMoving) {
    return;
  }

  // Release workstation if leaving CODING
  if (entity.visualState === 'CODING' && nextState !== 'CODING') {
    releaseWorkstation(entity.id);
  }

  // Get target zone
  const targetZone = getTargetZone(entity, nextState);
  if (!targetZone) {
    // Can't find a zone, re-queue and try later
    entity.stateQueue.unshift(nextStateInfo);
    return;
  }

  // Calculate path to zone
  const path = findPath(entity.x, entity.y, targetZone.centerX, targetZone.centerY);

  if (!path || path.length === 0) {
    console.warn(`No path found for entity ${entity.id} to ${nextState}`);
    // Try direct movement as fallback
    entity.path = [{ x: targetZone.centerX, y: targetZone.centerY }];
  } else {
    // Smooth the path for more natural movement
    entity.path = smoothPath(path);
    // Add exact target point as final waypoint (path returns tile centers)
    const lastWaypoint = entity.path[entity.path.length - 1];
    if (lastWaypoint.x !== targetZone.centerX || lastWaypoint.y !== targetZone.centerY) {
      entity.path.push({ x: targetZone.centerX, y: targetZone.centerY });
    }
  }

  entity.pathIndex = 0;
  entity.targetState = nextState;
  entity.targetZone = targetZone;
  entity.isMoving = true;
  entity.currentSpeed = MOVE_SPEED; // Full speed for state transitions

  console.log(`Entity ${entity.id} pathfinding to ${targetZone.id} for state ${nextState}, ${entity.path.length} waypoints`);
}

/**
 * Get the target zone for a state
 * @param {object} entity
 * @param {string} state
 * @returns {object|null} Zone object
 */
function getTargetZone(entity, state) {
  // For CODING, assign or get existing workstation
  if (state === 'CODING') {
    const existingWorkstation = getEntityWorkstation(entity.id);
    if (existingWorkstation) return existingWorkstation;

    return assignWorkstation(entity.id);
  }

  // For other states, pick a random zone of that type
  const zones = getZonesForState(state);
  if (zones.length === 0) return null;

  // For THINKING and IDLE, pick random spot within the zone
  if (state === 'THINKING' || state === 'IDLE') {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const randomPoint = getRandomPointInZone(zone);
    return {
      ...zone,
      centerX: randomPoint.x,
      centerY: randomPoint.y
    };
  }

  // For PLANNING, pick a random planning zone
  return zones[Math.floor(Math.random() * zones.length)];
}
