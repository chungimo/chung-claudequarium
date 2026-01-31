// Background Rendering
// Handles background image loading and drawing

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.js';

let backgroundImage = null;
let backgroundLoaded = false;

/**
 * Load the background image
 */
export function loadBackground() {
  backgroundImage = new Image();
  backgroundImage.onload = () => {
    backgroundLoaded = true;
    console.log('Background image loaded');
  };
  backgroundImage.onerror = () => {
    console.error('Failed to load background image');
  };
  backgroundImage.src = '/assets/background.png';
}

/**
 * Draw the background
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawBackground(ctx) {
  try {
    if (backgroundLoaded && backgroundImage) {
      ctx.drawImage(backgroundImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback gradient while loading
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#2d3436');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Loading text
      ctx.fillStyle = '#4ecca3';
      ctx.font = '16px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('Loading map...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  } catch (err) {
    console.error('Error drawing background:', err);
    // Fallback to solid color
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Error loading background', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

/**
 * Check if background is loaded
 * @returns {boolean}
 */
export function isBackgroundLoaded() {
  return backgroundLoaded;
}
