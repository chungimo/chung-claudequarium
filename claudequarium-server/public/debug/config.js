// Debug Configuration
// Central debug settings and state management

// Debug mode - controls visibility of debug controls
let debugModeEnabled = false;

// Debug visualization flags
export const DEBUG = {
  showCollisionGrid: false,
  showZoneBoundaries: false,
  showPathfinding: false,
  showEntityInfo: true
};

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled() {
  return debugModeEnabled;
}

/**
 * Enable or disable debug mode
 */
export function setDebugMode(enabled) {
  debugModeEnabled = enabled;
  updateDebugUIVisibility();
  console.log(`Debug mode: ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Toggle a specific debug visualization option
 */
export function toggleDebug(option) {
  if (option in DEBUG) {
    DEBUG[option] = !DEBUG[option];
    console.log(`Debug ${option}: ${DEBUG[option]}`);
  }
}

/**
 * Update debug UI visibility based on debug mode
 */
function updateDebugUIVisibility() {
  const debugControls = document.getElementById('debug-controls');
  if (debugControls) {
    debugControls.classList.toggle('hidden', !debugModeEnabled);
  }
}

/**
 * Initialize debug mode from saved settings
 */
export function initDebugMode() {
  // Load from localStorage or default to false
  const saved = localStorage.getItem('claudequarium-debug-mode');
  debugModeEnabled = saved === 'true';
  updateDebugUIVisibility();
}

/**
 * Save debug mode preference
 */
export function saveDebugMode() {
  localStorage.setItem('claudequarium-debug-mode', debugModeEnabled.toString());
}
