// Network / WebSocket Management

import { WS_URL, MAX_RECONNECT_ATTEMPTS } from './config.js';
import {
  entities, spawnOrder, setSpawnOrder, setSelectedEntityId,
  selectedEntityId, clearDeskAssignments
} from './state.js';
import { createEntity, queueStateChange, cleanupEntity } from './entities.js';
import { updateConnectionStatus, updateEntityCount } from './ui.js';

let ws = null;
let reconnectAttempts = 0;

export function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
    reconnectAttempts = 0;
  };

  ws.onclose = () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${reconnectAttempts})`);
      setTimeout(connectWebSocket, 2000);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };
}

function handleMessage(message) {
  console.log('Received:', message);

  switch (message.type) {
    case 'FULL_STATE':
      handleFullState(message);
      break;
    case 'ENTITY_SPAWNED':
      handleEntitySpawned(message);
      break;
    case 'ENTITY_DESPAWNED':
      handleEntityDespawned(message);
      break;
    case 'ENTITY_STATE':
      handleEntityState(message);
      break;
    case 'ENTITY_WAVE':
      handleEntityWave(message);
      break;
  }
}

function handleFullState(message) {
  entities.clear();
  setSpawnOrder([]);
  clearDeskAssignments();

  message.entities.forEach(entityData => {
    const entity = createEntity(entityData);
    entities.set(entityData.entity_id, entity);
    spawnOrder.push(entityData.entity_id);

    if (entityData.state && entityData.state !== 'SPAWNED') {
      queueStateChange(entity, entityData.state);
    }
  });

  updateEntityCount();
}

function handleEntitySpawned(message) {
  const entity = createEntity({
    entity_id: message.entity_id,
    appearance: message.appearance,
    state: 'SPAWNED'
  });

  entities.set(message.entity_id, entity);
  spawnOrder.push(message.entity_id);
  setSelectedEntityId(message.entity_id);
  updateEntityCount();
}

function handleEntityDespawned(message) {
  const entity = entities.get(message.entity_id);
  if (entity) {
    cleanupEntity(entity);
  }

  entities.delete(message.entity_id);
  setSpawnOrder(spawnOrder.filter(id => id !== message.entity_id));

  if (selectedEntityId === message.entity_id) {
    setSelectedEntityId(spawnOrder.length > 0 ? spawnOrder[spawnOrder.length - 1] : null);
  }

  updateEntityCount();
}

function handleEntityState(message) {
  const entity = entities.get(message.entity_id);
  if (entity) {
    queueStateChange(entity, message.state);
  }
}

function handleEntityWave(message) {
  const entity = entities.get(message.entity_id);
  if (entity) {
    entity.isWaving = true;
    entity.waveStartTime = Date.now();
    entity.waveDuration = message.duration || 3000;
    entity.waveRotation = 0;
    console.log(`Entity ${message.entity_id} is waving!`);
  }
}
