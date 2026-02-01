// Canvas Renderer
// Main renderer module - handles initialization and render loop

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';
import { entities } from '../state.js';
import { loadBackground, drawBackground, isBackgroundLoaded } from './background.js';
import { drawEntity } from './entity.js';
import { DEBUG, drawCollisionGrid, drawZoneBoundaries, drawPathfindingDebug } from '../debug/index.js';

// ============================================
// Canvas State
// ============================================

let canvas = null;
let ctx = null;

// ============================================
// Initialization
// ============================================

/**
 * Initialize the renderer
 */
export function initRenderer() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  ctx = canvas.getContext('2d');

  // Set canvas size
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Load background image
  loadBackground();
}

// ============================================
// Main Render Loop
// ============================================

/**
 * Main render function - called each frame
 */
export function render() {
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw background
  drawBackground(ctx);

  // Draw debug overlays (behind entities)
  if (DEBUG.showCollisionGrid) drawCollisionGrid(ctx);
  if (DEBUG.showZoneBoundaries) drawZoneBoundaries(ctx);

  // Draw entities
  drawEntities();

  // Draw pathfinding debug (on top of entities)
  if (DEBUG.showPathfinding) drawPathfindingDebug(ctx);
}

/**
 * Draw all entities
 */
function drawEntities() {
  entities.forEach(entity => {
    drawEntity(ctx, entity);
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get canvas context for external use
 * @returns {CanvasRenderingContext2D|null}
 */
export function getContext() {
  return ctx;
}

/**
 * Check if background is loaded
 * @returns {boolean}
 */
export { isBackgroundLoaded };

/**
 * Convert screen coordinates to canvas coordinates
 * @param {number} screenX
 * @param {number} screenY
 * @returns {{x: number, y: number}}
 */
export function screenToCanvas(screenX, screenY) {
  if (!canvas) return { x: 0, y: 0 };

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (screenX - rect.left) * scaleX,
    y: (screenY - rect.top) * scaleY
  };
}
