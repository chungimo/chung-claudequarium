// Entity Wandering
// Handles wandering behavior for THINKING and IDLE states

import { MOVE_SPEED, WANDER_MIN_DELAY_MS, WANDER_MAX_DELAY_MS } from '../config.js';
import { getZonesForState, getRandomPointInZone } from '../mapData.js';
import { findPath, smoothPath } from '../pathfinding.js';

/**
 * Handle wandering behavior for THINKING and IDLE states
 * @param {object} entity
 */
export function updateWandering(entity) {
  // Only wander in THINKING or IDLE states
  if (entity.visualState !== 'THINKING' && entity.visualState !== 'IDLE') {
    entity.wanderZone = null;
    entity.currentSpeed = MOVE_SPEED; // Reset to full speed
    return;
  }

  // Check if it's time to wander
  const now = Date.now();
  if (now < entity.nextWanderTime) {
    return;
  }

  // Get zones for this state
  const zones = getZonesForState(entity.visualState);
  if (zones.length === 0) return;

  let zone;
  if (entity.visualState === 'IDLE') {
    // IDLE: Can roam between ANY idle zone
    zone = zones[Math.floor(Math.random() * zones.length)];
    // Set random leisurely speed (40% to 80% of normal) for meandering style
    entity.currentSpeed = MOVE_SPEED * (0.4 + Math.random() * 0.4);
  } else {
    // THINKING: Stay within current zone
    zone = entity.wanderZone;
    if (!zone) {
      // Find the zone entity is currently in, or pick random
      zone = zones.find(z =>
        entity.x >= z.x && entity.x <= z.x + z.width &&
        entity.y >= z.y && entity.y <= z.y + z.height
      ) || zones[Math.floor(Math.random() * zones.length)];
      entity.wanderZone = zone;
    }
    entity.currentSpeed = MOVE_SPEED; // Full speed for thinking
  }

  // Pick a random point within the target zone
  const targetPoint = getRandomPointInZone(zone);

  // Calculate path to new position
  const path = findPath(entity.x, entity.y, targetPoint.x, targetPoint.y);

  if (path && path.length > 1) {
    entity.path = smoothPath(path);
    // Add exact target point as final waypoint (path returns tile centers)
    const lastWaypoint = entity.path[entity.path.length - 1];
    if (lastWaypoint.x !== targetPoint.x || lastWaypoint.y !== targetPoint.y) {
      entity.path.push({ x: targetPoint.x, y: targetPoint.y });
    }
    entity.pathIndex = 0;
    entity.targetZone = { ...zone, centerX: targetPoint.x, centerY: targetPoint.y };
    entity.targetState = entity.visualState; // Stay in same state
    entity.isMoving = true;
  }

  // Schedule next wander
  scheduleNextWander(entity);
}

/**
 * Schedule next wander time for entity
 * @param {object} entity
 */
export function scheduleNextWander(entity) {
  const delay = WANDER_MIN_DELAY_MS + Math.random() * (WANDER_MAX_DELAY_MS - WANDER_MIN_DELAY_MS);
  entity.nextWanderTime = Date.now() + delay;
}
