// Main Entry Point
// Initializes all game modules and starts the game loop

import { entities } from './state.js';
import { updateEntity } from './entities.js';
import { connectWebSocket } from './network.js';
import { initRenderer, render } from './renderer.js';
import { initUI } from './ui.js';
import { spawnEntity, despawnLast, despawnAll, setEntityState, waveEntity } from './api.js';
import { loadMapData, isMapLoaded } from './mapData.js';
import { toggleDebug, DEBUG } from './config.js';
import { Menu } from './components/menu.js';

// ============================================
// Game State
// ============================================

let lastFrameTime = 0;
let isInitialized = false;
let mainMenu = null;

// ============================================
// Initialization
// ============================================

async function init() {
  console.log('Initializing CC Office Game...');

  // Initialize renderer first so we can show loading state
  initRenderer();
  initUI();

  // Initialize menu
  mainMenu = new Menu({
    containerId: 'menu-container',
    isLoggedIn: false,
    onItemClick: handleMenuItemClick
  });
  mainMenu.create();

  // Start game loop immediately to show loading screen
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);

  try {
    // Load map data (required for gameplay)
    console.log('Loading map data...');
    await loadMapData();
    console.log('Map data loaded successfully');

    // Setup controls
    setupDevControls();
    setupKeyboardShortcuts();

    // Connect to server
    connectWebSocket();

    // Mark as initialized
    isInitialized = true;
    console.log('Game initialized successfully');

  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to load game resources. Please refresh the page.');
  }
}

// ============================================
// Menu Handlers
// ============================================

function handleMenuItemClick(itemId, _event) {
  console.log(`Menu item clicked: ${itemId}`);

  switch (itemId) {
    case 'account':
      // TODO: Implement login/account page
      console.log('Navigate to login/account');
      break;
    case 'logs':
      // TODO: Implement logs page
      console.log('Navigate to logs');
      break;
    case 'settings':
      // TODO: Implement settings page
      console.log('Navigate to settings');
      break;
    case 'logout':
      // TODO: Implement logout
      console.log('Logout');
      break;
  }
}

// ============================================
// Dev Controls
// ============================================

function setupDevControls() {
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

// ============================================
// Keyboard Shortcuts
// ============================================

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key.toLowerCase()) {
      // Debug toggles
      case 'c':
        toggleDebug('showCollisionGrid');
        break;
      case 'z':
        toggleDebug('showZoneBoundaries');
        break;
      case 'p':
        toggleDebug('showPathfinding');
        break;
      case 'i':
        toggleDebug('showEntityInfo');
        break;

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
  console.log('Keyboard shortcuts:');
  console.log('  C - Toggle collision grid');
  console.log('  Z - Toggle zone boundaries');
  console.log('  P - Toggle pathfinding visualization');
  console.log('  I - Toggle entity info');
  console.log('  S - Spawn entity');
  console.log('  W - Wave');
  console.log('  1-4 - Set state (Thinking/Planning/Coding/Idle)');
}

// ============================================
// Game Loop
// ============================================

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  // Cap delta time to prevent huge jumps
  const cappedDelta = Math.min(deltaTime, 0.1);

  update(cappedDelta);
  render();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  if (!isInitialized || !isMapLoaded()) return;

  entities.forEach(entity => {
    updateEntity(entity, deltaTime);
  });
}

// ============================================
// Error Handling
// ============================================

function showError(message) {
  const container = document.getElementById('game-container');
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff6b6b;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      z-index: 1000;
    `;
    container.appendChild(errorDiv);
  }
}

// ============================================
// Start
// ============================================

// Start when DOM is ready
window.addEventListener('load', init);

// Export for debugging
window.gameDebug = {
  toggleDebug,
  DEBUG,
  getEntities: () => Array.from(entities.values()),
  getMenu: () => mainMenu
};
