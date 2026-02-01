// Debug API Functions
// Handles entity spawning, despawning, state changes, and actions

import { API_URL } from '../js/config.js';
import { spawnOrder, selectedEntityId, incrementDevSessionCounter } from '../js/state.js';

/**
 * Spawn a new debug entity
 */
export async function spawnEntity() {
  const counter = incrementDevSessionCounter();
  const sessionId = `dev-session-${counter}`;

  try {
    const response = await fetch(`${API_URL}/api/spawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await response.json();
    console.log('Spawned:', data);
    return data;
  } catch (error) {
    console.error('Spawn failed:', error);
    return null;
  }
}

/**
 * Despawn a specific entity by ID
 */
export async function despawnEntity(entityId) {
  try {
    const response = await fetch(`${API_URL}/api/despawn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId })
    });
    const data = await response.json();
    console.log('Despawned:', entityId, data);
    return data;
  } catch (error) {
    console.error('Despawn failed:', error);
    return null;
  }
}

/**
 * Despawn the most recently spawned entity
 */
export async function despawnLast() {
  if (spawnOrder.length === 0) {
    console.log('No entities to despawn');
    return null;
  }
  return despawnEntity(spawnOrder[spawnOrder.length - 1]);
}

/**
 * Despawn all spawned entities
 */
export async function despawnAll() {
  const ids = [...spawnOrder];
  for (const entityId of ids) {
    await despawnEntity(entityId);
  }
}

/**
 * Set the state of the currently selected entity
 */
export async function setEntityState(state) {
  if (!selectedEntityId) {
    console.log('No entity selected. Spawn one first.');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: selectedEntityId, state })
    });
    const data = await response.json();
    console.log('State changed:', selectedEntityId, state, data);
    return data;
  } catch (error) {
    console.error('State change failed:', error);
    return null;
  }
}

/**
 * Make the selected entity wave
 */
export async function waveEntity() {
  if (!selectedEntityId) {
    console.log('No entity selected. Spawn one first.');
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/wave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: selectedEntityId })
    });
    const data = await response.json();
    console.log('Wave triggered:', selectedEntityId, data);
    return data;
  } catch (error) {
    console.error('Wave failed:', error);
    return null;
  }
}
