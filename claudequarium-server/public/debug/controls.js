// Debug Controls
// Handles UI control setup and keyboard shortcuts

import { toggleDebug, isDebugEnabled } from './config.js';
import { spawnEntity, despawnLast, despawnAll, setEntityState, waveEntity } from './api.js';

/**
 * Setup debug button controls
 */
export function setupDebugControls() {
  // Entity controls
  const btnSpawn = document.getElementById('btn-spawn');
  const btnDespawn = document.getElementById('btn-despawn');
  const btnDespawnAll = document.getElementById('btn-despawn-all');

  if (btnSpawn) btnSpawn.addEventListener('click', spawnEntity);
  if (btnDespawn) btnDespawn.addEventListener('click', despawnLast);
  if (btnDespawnAll) btnDespawnAll.addEventListener('click', despawnAll);

  // State controls
  const stateButtons = {
    'btn-thinking': 'THINKING',
    'btn-planning': 'PLANNING',
    'btn-coding': 'CODING',
    'btn-idle': 'IDLE'
  };

  for (const [btnId, state] of Object.entries(stateButtons)) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => setEntityState(state));
    }
  }

  // Wave button
  const btnWave = document.getElementById('btn-wave');
  if (btnWave) btnWave.addEventListener('click', waveEntity);
}

/**
 * Setup keyboard shortcuts for debug features
 */
export function setupDebugKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input or modal is open
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Debug visualization toggles (always available)
    switch (e.key.toLowerCase()) {
      case 'c':
        toggleDebug('showCollisionGrid');
        return;
      case 'z':
        toggleDebug('showZoneBoundaries');
        return;
      case 'p':
        toggleDebug('showPathfinding');
        return;
      case 'i':
        toggleDebug('showEntityInfo');
        return;
    }

    // Debug mode-only controls
    if (!isDebugEnabled()) return;

    switch (e.key.toLowerCase()) {
      // Quick spawn (for testing)
      case 's':
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with save
        spawnEntity();
        break;

      // State changes for selected entity
      case '1':
        setEntityState('THINKING');
        break;
      case '2':
        setEntityState('PLANNING');
        break;
      case '3':
        setEntityState('CODING');
        break;
      case '4':
        setEntityState('IDLE');
        break;

      // Wave action
      case 'w':
        waveEntity();
        break;
    }
  });

  // Log available shortcuts
  console.log('Debug keyboard shortcuts:');
  console.log('  C - Toggle collision grid');
  console.log('  Z - Toggle zone boundaries');
  console.log('  P - Toggle pathfinding visualization');
  console.log('  I - Toggle entity info');
  if (isDebugEnabled()) {
    console.log('  S - Spawn entity (debug mode)');
    console.log('  W - Wave (debug mode)');
    console.log('  1-4 - Set state (debug mode)');
  }
}
