// Wave Animation
// Handles the wave animation effect (glow, spin, happy eyes)

import { ENTITY_SIZE } from '../../config.js';

// Wave phase durations (in ms)
const PHASE_1_DURATION = 2000; // Look up at camera
const PHASE_2_DURATION = 3000; // Spin
const PHASE_3_DURATION = 2000; // Look up again
const TOTAL_DURATION = PHASE_1_DURATION + PHASE_2_DURATION + PHASE_3_DURATION;

/**
 * Update wave animation state for an entity
 * @param {object} entity
 * @returns {boolean} Whether entity is still waving
 */
export function updateWaveState(entity) {
  if (!entity.isWaving) return false;

  const elapsed = Date.now() - entity.waveStartTime;

  if (elapsed >= TOTAL_DURATION) {
    // Animation complete
    entity.isWaving = false;
    entity.waveRotation = 0;
    entity.wavePhase = 0;
    return false;
  }

  if (elapsed < PHASE_1_DURATION) {
    // Phase 1: Look straight up at camera
    entity.wavePhase = 1;
    entity.waveRotation = 0;
  } else if (elapsed < PHASE_1_DURATION + PHASE_2_DURATION) {
    // Phase 2: Spin around
    entity.wavePhase = 2;
    const spinElapsed = elapsed - PHASE_1_DURATION;
    entity.waveRotation = (spinElapsed / 500) * Math.PI * 2; // Full rotation every 500ms
  } else {
    // Phase 3: Look straight up again
    entity.wavePhase = 3;
    entity.waveRotation = 0;
  }

  return true;
}

/**
 * Apply wave glow effect to context
 * @param {CanvasRenderingContext2D} ctx
 */
export function applyWaveGlow(ctx) {
  const glowIntensity = 0.5 + Math.sin(Date.now() / 100) * 0.3;
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 20 * glowIntensity;
}

/**
 * Clear wave glow effect from context
 * @param {CanvasRenderingContext2D} ctx
 */
export function clearWaveGlow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

/**
 * Check if entity should rotate (only in spin phase)
 * @param {object} entity
 * @returns {boolean}
 */
export function shouldRotate(entity) {
  return entity.isWaving && entity.wavePhase === 2;
}

/**
 * Get current rotation angle for waving entity
 * @param {object} entity
 * @returns {number}
 */
export function getWaveRotation(entity) {
  return entity.waveRotation || 0;
}

/**
 * Draw wave indicator (emoji) above entity
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entity
 */
export function drawWaveIndicator(ctx, entity) {
  const y = entity.y - ENTITY_SIZE / 2 - 16;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👋', entity.x, y);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Get wave animation durations (for external use)
 * @returns {object}
 */
export function getWaveDurations() {
  return {
    phase1: PHASE_1_DURATION,
    phase2: PHASE_2_DURATION,
    phase3: PHASE_3_DURATION,
    total: TOTAL_DURATION
  };
}
