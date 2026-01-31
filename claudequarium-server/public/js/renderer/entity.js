// Entity Rendering
// Handles drawing individual entities (body, selection, shadow)

import { ENTITY_SIZE, DEBUG } from '../config.js';
import { selectedEntityId } from '../state.js';
import { drawHappyEyes, drawEntityEyesRelative } from './eyes.js';
import { drawStateIndicator } from './indicators.js';
import {
  updateWaveState,
  applyWaveGlow,
  clearWaveGlow,
  shouldRotate,
  getWaveRotation,
  drawWaveIndicator
} from './animations/wave.js';

/**
 * Draw a single entity
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entity
 */
export function drawEntity(ctx, entity) {
  const size = ENTITY_SIZE;
  const isSelected = entity.id === selectedEntityId;

  // Update wave animation state
  updateWaveState(entity);

  // Selection indicator
  if (isSelected) {
    drawSelectionIndicator(ctx, entity, size);
  }

  // Glow effect when waving
  if (entity.isWaving) {
    applyWaveGlow(ctx);
  }

  // Shadow
  drawEntityShadow(ctx, entity, size);

  // Save context for rotation
  ctx.save();
  ctx.translate(entity.x, entity.y);

  if (shouldRotate(entity)) {
    ctx.rotate(getWaveRotation(entity));
  }

  // Body
  drawEntityBody(ctx, entity, size);

  // Reset shadow after body
  clearWaveGlow(ctx);

  // Eyes (draw relative to center)
  if (entity.isWaving) {
    drawHappyEyes(ctx, size);
  } else {
    drawEntityEyesRelative(ctx, entity, size);
  }

  // Restore context
  ctx.restore();

  // State indicator (drawn after restore, at entity position)
  if (entity.isWaving) {
    drawWaveIndicator(ctx, entity);
  } else {
    drawStateIndicator(ctx, entity);
  }

  // Entity ID (if debug enabled)
  if (DEBUG.showEntityInfo) {
    drawEntityId(ctx, entity, size);
  }
}

/**
 * Draw selection indicator around entity
 */
function drawSelectionIndicator(ctx, entity, size) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(entity.x, entity.y, size / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw entity shadow
 */
function drawEntityShadow(ctx, entity, size) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(entity.x, entity.y + size / 2 - 2, size / 2.5, size / 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw entity body (circle with border)
 */
function drawEntityBody(ctx, entity, size) {
  ctx.fillStyle = entity.color;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Draw entity ID below entity (debug)
 */
function drawEntityId(ctx, entity, size) {
  const idText = entity.id.slice(0, 6);
  const idY = entity.y + size / 2 + 14;

  ctx.font = 'bold 10px Courier New';
  ctx.textAlign = 'center';

  // Draw outline/stroke for readability
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.strokeText(idText, entity.x, idY);

  // Draw fill
  ctx.fillStyle = '#4ecca3';
  ctx.fillText(idText, entity.x, idY);
}
