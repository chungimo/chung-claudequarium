// UI Updates

import { entities } from './state.js';

let connectionStatusEl = null;
let entityCountEl = null;

export function initUI() {
  connectionStatusEl = document.getElementById('connection-status');
  entityCountEl = document.getElementById('entity-count');
}

export function updateConnectionStatus(connected) {
  if (!connectionStatusEl) return;
  connectionStatusEl.textContent = connected ? 'Connected' : 'Disconnected';
  connectionStatusEl.className = connected ? 'connected' : 'disconnected';
}

export function updateEntityCount() {
  if (!entityCountEl) return;
  entityCountEl.textContent = `Entities: ${entities.size}`;
}
