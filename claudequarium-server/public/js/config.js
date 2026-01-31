// Game Configuration
// Central configuration for game constants
// Map-specific data is loaded dynamically from mapData.js

// ============================================
// Canvas & Display
// ============================================

// These match the tilemap dimensions (25x20 tiles at 48px)
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 960;

// ============================================
// Server URLs
// ============================================

export const WS_URL = `ws://${window.location.host}`;
export const API_URL = `http://${window.location.host}`;

// ============================================
// Movement & Animation
// ============================================

export const MOVE_SPEED = 150; // pixels per second (increased for larger map)
export const MIN_STATE_DISPLAY_MS = 4000; // minimum time to show each state
export const MAX_RECONNECT_ATTEMPTS = 10;

// Pathfinding
export const PATH_ARRIVAL_THRESHOLD = 4; // pixels - how close to waypoint before advancing

// Wandering (for THINKING and IDLE states)
export const WANDER_MIN_DELAY_MS = 3000; // minimum time before wandering
export const WANDER_MAX_DELAY_MS = 6000; // maximum time before wandering

// ============================================
// Entity Appearance
// ============================================

export const ENTITY_COLORS = [
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3',
  '#f38181', '#aa96da', '#fcbad3', '#a8e6cf'
];

export const ENTITY_SIZE = 32; // Base entity size in pixels

// ============================================
// State Configuration
// ============================================

// Maps game states to zone types in map data
export const STATE_TO_ZONE_TYPE = {
  CODING: 'workstations',
  PLANNING: 'planningZones',
  THINKING: 'thinkingZones',
  IDLE: 'idleZones'
};

// Valid game states
export const GAME_STATES = ['SPAWNED', 'THINKING', 'PLANNING', 'CODING', 'IDLE'];

// ============================================
// Debug Options
// ============================================

export const DEBUG = {
  showCollisionGrid: false,
  showZoneBoundaries: false,
  showPathfinding: false,
  showEntityInfo: true
};

// Toggle debug option
export function toggleDebug(option) {
  if (option in DEBUG) {
    DEBUG[option] = !DEBUG[option];
    console.log(`Debug ${option}: ${DEBUG[option]}`);
  }
}
