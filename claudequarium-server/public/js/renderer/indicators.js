// State Indicators
// Handles drawing state indicators above entities

import { ENTITY_SIZE } from '../config.js';

/**
 * Draw state indicator above entity
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entity
 */
export function drawStateIndicator(ctx, entity) {
  const state = entity.isMoving ? 'WALKING' : entity.visualState;
  const y = entity.y - ENTITY_SIZE / 2 - 16;

  // Set up shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.font = 'bold 16px Courier New';
  ctx.textAlign = 'center';

  switch (state) {
    case 'THINKING':
      drawThinkingIndicator(ctx, entity.x, y, entity.animationFrame);
      break;
    case 'PLANNING':
      drawPlanningIndicator(ctx, entity.x, y);
      break;
    case 'CODING':
      drawCodingIndicator(ctx, entity.x, y, entity.animationFrame);
      break;
    case 'IDLE':
      drawIdleIndicator(ctx, entity.x, y, entity.animationFrame);
      break;
    case 'WALKING':
      drawWalkingIndicator(ctx, entity.x, y, entity.animationFrame);
      break;
    case 'SPAWNED':
      drawSpawnedIndicator(ctx, entity.x, y);
      break;
  }

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawThinkingIndicator(ctx, x, y, animationFrame) {
  ctx.fillStyle = '#ffe66d';
  ctx.fillText('?', x, y);
  ctx.font = 'bold 14px Courier New';
  if (animationFrame % 2 === 0) {
    ctx.fillText('...', x, y - 14);
  }
}

function drawPlanningIndicator(ctx, x, y) {
  ctx.fillStyle = '#4ecca3';
  ctx.font = '20px sans-serif';
  ctx.fillText('💡', x, y);
}

function drawCodingIndicator(ctx, x, y, animationFrame) {
  ctx.fillStyle = '#4ecdc4';
  const symbols = ['</>', '{ }', '[ ]', '( )'];
  ctx.fillText(symbols[animationFrame], x, y);
}

function drawIdleIndicator(ctx, x, y, animationFrame) {
  ctx.fillStyle = '#aa96da';
  ctx.font = 'bold 14px Courier New';
  ctx.fillText('z', x - 6, y);
  if (animationFrame > 1) {
    ctx.font = 'bold 15px Courier New';
    ctx.fillText('z', x, y - 8);
  }
  if (animationFrame > 2) {
    ctx.font = 'bold 18px Courier New';
    ctx.fillText('Z', x + 7, y - 16);
  }
}

function drawWalkingIndicator(ctx, x, y, animationFrame) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 18px Courier New';
  const walkFrame = animationFrame % 2;
  ctx.fillText(walkFrame ? '›' : '»', x, y);
}

function drawSpawnedIndicator(ctx, x, y) {
  ctx.fillStyle = '#ffe66d';
  ctx.font = '18px sans-serif';
  ctx.fillText('★', x, y);
}
