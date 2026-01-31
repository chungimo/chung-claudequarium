// Game State Management
// Handles entity storage, zone assignments, and selection state

import { getZonesByType } from './mapData.js';

// ============================================
// Entity Storage
// ============================================

export const entities = new Map();
export let spawnOrder = [];
export let selectedEntityId = null;

// ============================================
// Zone Assignments
// Tracks which entities are assigned to which zones
// Uses zone IDs from map data instead of hardcoded names
// ============================================

// Map of zoneId -> entityId (for exclusive zones like workstations)
const zoneAssignments = new Map();

// Map of entityId -> zoneId (reverse lookup)
const entityZoneMap = new Map();

// ============================================
// Dev Mode
// ============================================

export let devSessionCounter = 0;

// ============================================
// State Setters
// ============================================

export function setSpawnOrder(order) {
  spawnOrder = order;
}

export function setSelectedEntityId(id) {
  selectedEntityId = id;
}

export function incrementDevSessionCounter() {
  devSessionCounter++;
  return devSessionCounter;
}

// ============================================
// Workstation Management
// ============================================

/**
 * Assign an available workstation to an entity
 * @param {string} entityId
 * @returns {object|null} The assigned workstation zone object, or null if none available
 */
export function assignWorkstation(entityId) {
  // Check if entity already has a workstation
  const existing = getAssignedZone(entityId, 'workstations');
  if (existing) return existing;

  // Find available workstation
  const workstations = getZonesByType('workstations');

  for (const workstation of workstations) {
    if (!zoneAssignments.has(workstation.id)) {
      zoneAssignments.set(workstation.id, entityId);
      entityZoneMap.set(`${entityId}:workstations`, workstation.id);
      console.log(`Assigned workstation ${workstation.id} to entity ${entityId}`);
      return workstation;
    }
  }

  console.warn(`No available workstations for entity ${entityId}`);
  return null;
}

/**
 * Release a workstation assignment
 * @param {string} entityId
 */
export function releaseWorkstation(entityId) {
  const zoneId = entityZoneMap.get(`${entityId}:workstations`);
  if (zoneId) {
    zoneAssignments.delete(zoneId);
    entityZoneMap.delete(`${entityId}:workstations`);
    console.log(`Released workstation ${zoneId} from entity ${entityId}`);
  }
}

/**
 * Get the workstation assigned to an entity
 * @param {string} entityId
 * @returns {object|null} Workstation zone object or null
 */
export function getEntityWorkstation(entityId) {
  return getAssignedZone(entityId, 'workstations');
}

// ============================================
// Generic Zone Assignment (for future extensibility)
// ============================================

/**
 * Get the zone assigned to an entity for a given zone type
 * @param {string} entityId
 * @param {string} zoneType - 'workstations', 'planningZones', etc.
 * @returns {object|null}
 */
export function getAssignedZone(entityId, zoneType) {
  const zoneId = entityZoneMap.get(`${entityId}:${zoneType}`);
  if (!zoneId) return null;

  const zones = getZonesByType(zoneType);
  return zones.find(z => z.id === zoneId) || null;
}

/**
 * Check if a zone is occupied
 * @param {string} zoneId
 * @returns {boolean}
 */
export function isZoneOccupied(zoneId) {
  return zoneAssignments.has(zoneId);
}

/**
 * Get entity ID occupying a zone
 * @param {string} zoneId
 * @returns {string|null}
 */
export function getZoneOccupant(zoneId) {
  return zoneAssignments.get(zoneId) || null;
}

// ============================================
// Cleanup
// ============================================

/**
 * Clear all zone assignments for an entity
 * @param {string} entityId
 */
export function clearEntityAssignments(entityId) {
  // Find and remove all assignments for this entity
  const keysToDelete = [];

  for (const [key, value] of entityZoneMap.entries()) {
    if (key.startsWith(`${entityId}:`)) {
      keysToDelete.push(key);
      zoneAssignments.delete(value);
    }
  }

  for (const key of keysToDelete) {
    entityZoneMap.delete(key);
  }
}

/**
 * Clear all zone assignments (reset state)
 */
export function clearAllAssignments() {
  zoneAssignments.clear();
  entityZoneMap.clear();
}

/**
 * Get assignment stats for debugging
 * @returns {object}
 */
export function getAssignmentStats() {
  const workstations = getZonesByType('workstations');
  const assigned = workstations.filter(ws => zoneAssignments.has(ws.id)).length;

  return {
    totalWorkstations: workstations.length,
    assignedWorkstations: assigned,
    availableWorkstations: workstations.length - assigned
  };
}

// ============================================
// Legacy Compatibility (can be removed later)
// Maps old desk names to new system
// ============================================

export const deskAssignments = new Proxy({}, {
  get(_target, prop) {
    // Return the entity ID if the zone is assigned
    return zoneAssignments.get(prop) || null;
  }
});

export function assignDesk(entityId) {
  const workstation = assignWorkstation(entityId);
  return workstation ? workstation.id : null;
}

export function releaseDesk(deskId) {
  const entityId = zoneAssignments.get(deskId);
  if (entityId) {
    releaseWorkstation(entityId);
  }
}

export function clearDeskAssignments() {
  clearAllAssignments();
}

export function getDeskForEntity(entityId) {
  const workstation = getEntityWorkstation(entityId);
  return workstation ? workstation.id : null;
}
