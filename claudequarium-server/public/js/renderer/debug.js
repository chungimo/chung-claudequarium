// Debug Overlays
// Handles drawing debug visualizations (collision grid, zones, pathfinding)

import { getMapDimensions, getCollisionGrid, getZonesByType } from '../mapData.js';
import { entities } from '../state.js';

/**
 * Draw collision grid overlay
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawCollisionGrid(ctx) {
  const grid = getCollisionGrid();
  const dims = getMapDimensions();
  if (!grid || !dims) return;

  ctx.globalAlpha = 0.3;

  for (let y = 0; y < dims.tilesY; y++) {
    for (let x = 0; x < dims.tilesX; x++) {
      if (grid[y][x]) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(
          x * dims.tileWidth,
          y * dims.tileHeight,
          dims.tileWidth,
          dims.tileHeight
        );
      }
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Draw zone boundaries overlay
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawZoneBoundaries(ctx) {
  const zoneTypes = ['workstations', 'planningZones', 'thinkingZones', 'idleZones'];
  const colors = {
    workstations: '#4ecdc4',
    planningZones: '#4ecca3',
    thinkingZones: '#ffe66d',
    idleZones: '#aa96da'
  };

  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;

  for (const type of zoneTypes) {
    const zones = getZonesByType(type);
    ctx.strokeStyle = colors[type];
    ctx.fillStyle = colors[type];

    for (const zone of zones) {
      // Draw boundary
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      // Draw center point
      ctx.beginPath();
      ctx.arc(zone.centerX, zone.centerY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw zone ID
      ctx.globalAlpha = 0.8;
      ctx.font = '8px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(zone.id.slice(0, 15), zone.x + 2, zone.y + 10);
      ctx.globalAlpha = 0.4;
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Draw pathfinding debug overlay
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawPathfindingDebug(ctx) {
  entities.forEach(entity => {
    if (!entity.path || entity.path.length === 0) return;

    // Draw path
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(entity.x, entity.y);

    for (let i = entity.pathIndex; i < entity.path.length; i++) {
      ctx.lineTo(entity.path[i].x, entity.path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waypoints
    ctx.fillStyle = '#00ff00';
    for (let i = entity.pathIndex; i < entity.path.length; i++) {
      ctx.beginPath();
      ctx.arc(entity.path[i].x, entity.path[i].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
