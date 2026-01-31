// Entity Creation
// Handles creating new entity state objects

import { ENTITY_COLORS, MOVE_SPEED } from '../config.js';
import { getSpawnPoint } from '../mapData.js';

/**
 * Create a new entity state object
 * @param {object} data - Entity data from server
 * @returns {object} Entity state object
 */
export function createEntity(data) {
  const spawnPoint = getSpawnPoint();

  return {
    // Identity
    id: data.entity_id,
    appearance: data.appearance || {},

    // State
    state: data.state || 'SPAWNED',
    visualState: 'SPAWNED',
    targetState: null,

    // Position
    x: spawnPoint.x,
    y: spawnPoint.y,

    // Pathfinding
    path: [],
    pathIndex: 0,
    targetZone: null,

    // Movement
    isMoving: false,
    direction: 'down', // 'up', 'down', 'left', 'right'

    // Appearance
    color: ENTITY_COLORS[Math.floor(Math.random() * ENTITY_COLORS.length)],

    // Timing
    spawnTime: Date.now(),
    currentStateStartTime: Date.now(),

    // State queue for smooth transitions
    stateQueue: [],

    // Animation
    animationFrame: 0,
    animationTimer: 0,

    // Wandering (for THINKING/IDLE states)
    wanderZone: null,       // The zone entity is wandering in
    nextWanderTime: 0,      // When to next wander
    currentSpeed: MOVE_SPEED // Current movement speed (can vary for idle wandering)
  };
}
