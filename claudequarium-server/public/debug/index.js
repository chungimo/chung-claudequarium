// Debug Module
// Central export for all debug functionality

// Configuration
export {
  DEBUG,
  isDebugEnabled,
  setDebugMode,
  toggleDebug,
  initDebugMode,
  saveDebugMode
} from './config.js';

// API Functions
export {
  spawnEntity,
  despawnEntity,
  despawnLast,
  despawnAll,
  setEntityState,
  waveEntity
} from './api.js';

// Controls
export {
  setupDebugControls,
  setupDebugKeyboardShortcuts
} from './controls.js';

// Overlays
export {
  drawCollisionGrid,
  drawZoneBoundaries,
  drawPathfindingDebug
} from './overlays.js';

// Import for internal use in initDebug
import { initDebugMode } from './config.js';
import { setupDebugControls, setupDebugKeyboardShortcuts } from './controls.js';

/**
 * Initialize the debug module
 * Call this on app startup
 */
export function initDebug() {
  // Initialize debug mode from saved preferences
  initDebugMode();

  // Setup controls and keyboard shortcuts
  setupDebugControls();
  setupDebugKeyboardShortcuts();
}
