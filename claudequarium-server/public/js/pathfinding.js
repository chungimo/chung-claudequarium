// Pathfinding Module
// A* algorithm implementation for tile-based navigation
// Designed to be reusable and independent of specific game logic

import { isTileWalkable, pixelToTile, tileToPixel, getMapDimensions } from './mapData.js';

// ============================================
// A* Algorithm
// ============================================

/**
 * Find a path between two points using A* algorithm
 * @param {number} startX - Start pixel X
 * @param {number} startY - Start pixel Y
 * @param {number} goalX - Goal pixel X
 * @param {number} goalY - Goal pixel Y
 * @returns {Array<{x: number, y: number}>|null} Array of pixel waypoints or null if no path
 */
export function findPath(startX, startY, goalX, goalY) {
  const startTile = pixelToTile(startX, startY);
  const goalTile = pixelToTile(goalX, goalY);

  const tilePath = findTilePath(startTile, goalTile);

  if (!tilePath) return null;

  // Convert tile path to pixel waypoints (tile centers)
  return tilePath.map(tile => tileToPixel(tile.x, tile.y));
}

/**
 * Find a path between two tiles using A* algorithm
 * @param {{x: number, y: number}} start - Start tile
 * @param {{x: number, y: number}} goal - Goal tile
 * @returns {Array<{x: number, y: number}>|null} Array of tile coordinates or null
 */
export function findTilePath(start, goal) {
  const dims = getMapDimensions();
  if (!dims) return null;

  // If goal is not walkable, find nearest walkable tile
  let adjustedGoal = goal;
  if (!isTileWalkable(goal.x, goal.y)) {
    adjustedGoal = findNearestWalkable(goal.x, goal.y);
    if (!adjustedGoal) return null;
  }

  // If start is not walkable, find nearest walkable tile
  let adjustedStart = start;
  if (!isTileWalkable(start.x, start.y)) {
    adjustedStart = findNearestWalkable(start.x, start.y);
    if (!adjustedStart) return null;
  }

  // Same tile - no movement needed
  if (adjustedStart.x === adjustedGoal.x && adjustedStart.y === adjustedGoal.y) {
    return [adjustedGoal];
  }

  const openSet = new MinHeap();
  const closedSet = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const startKey = tileKey(adjustedStart.x, adjustedStart.y);
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(adjustedStart, adjustedGoal));
  openSet.insert({ ...adjustedStart, key: startKey }, fScore.get(startKey));

  // 4-directional movement
  const neighbors = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 }   // right
  ];

  let iterations = 0;
  const maxIterations = dims.tilesX * dims.tilesY * 2; // Safety limit

  while (!openSet.isEmpty() && iterations < maxIterations) {
    iterations++;

    const current = openSet.extractMin();

    if (current.x === adjustedGoal.x && current.y === adjustedGoal.y) {
      return reconstructPath(cameFrom, current.key, adjustedStart);
    }

    closedSet.add(current.key);

    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const neighborKey = tileKey(nx, ny);

      if (closedSet.has(neighborKey) || !isTileWalkable(nx, ny)) {
        continue;
      }

      const tentativeG = gScore.get(current.key) + 1;

      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, current.key);
        gScore.set(neighborKey, tentativeG);
        const f = tentativeG + heuristic({ x: nx, y: ny }, adjustedGoal);
        fScore.set(neighborKey, f);

        if (!openSet.has(neighborKey)) {
          openSet.insert({ x: nx, y: ny, key: neighborKey }, f);
        } else {
          openSet.decreaseKey(neighborKey, f);
        }
      }
    }
  }

  // No path found
  console.warn(`Pathfinding failed: ${startKey} -> ${tileKey(adjustedGoal.x, adjustedGoal.y)}`);
  return null;
}

/**
 * Find the nearest walkable tile to a given position
 * @param {number} tileX
 * @param {number} tileY
 * @param {number} maxRadius - Maximum search radius (default 5)
 * @returns {{x: number, y: number}|null}
 */
export function findNearestWalkable(tileX, tileY, maxRadius = 5) {
  if (isTileWalkable(tileX, tileY)) {
    return { x: tileX, y: tileY };
  }

  // Spiral outward search
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; // Only check perimeter

        const nx = tileX + dx;
        const ny = tileY + dy;

        if (isTileWalkable(nx, ny)) {
          return { x: nx, y: ny };
        }
      }
    }
  }

  return null;
}

// ============================================
// Path Smoothing (Optional Enhancement)
// ============================================

/**
 * Smooth a path by removing unnecessary waypoints
 * Uses line-of-sight checks to skip intermediate points
 * @param {Array<{x: number, y: number}>} path - Array of pixel waypoints
 * @returns {Array<{x: number, y: number}>}
 */
export function smoothPath(path) {
  if (!path || path.length < 3) return path;

  const smoothed = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    let furthest = current + 1;

    // Find furthest point with clear line of sight
    for (let i = current + 2; i < path.length; i++) {
      if (hasLineOfSight(path[current], path[i])) {
        furthest = i;
      }
    }

    smoothed.push(path[furthest]);
    current = furthest;
  }

  return smoothed;
}

/**
 * Check if there's a clear line of sight between two pixel points
 * @param {{x: number, y: number}} from
 * @param {{x: number, y: number}} to
 * @returns {boolean}
 */
export function hasLineOfSight(from, to) {
  const fromTile = pixelToTile(from.x, from.y);
  const toTile = pixelToTile(to.x, to.y);

  // Bresenham's line algorithm to check all tiles along the line
  const tiles = getLineTiles(fromTile.x, fromTile.y, toTile.x, toTile.y);

  return tiles.every(tile => isTileWalkable(tile.x, tile.y));
}

/**
 * Get all tiles along a line using Bresenham's algorithm
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @returns {Array<{x: number, y: number}>}
 */
function getLineTiles(x0, y0, x1, y1) {
  const tiles = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    tiles.push({ x, y });

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return tiles;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a unique key for a tile coordinate
 */
function tileKey(x, y) {
  return `${x},${y}`;
}

/**
 * Parse a tile key back to coordinates
 */
function keyToTile(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Manhattan distance heuristic
 */
function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * Reconstruct path from cameFrom map
 */
function reconstructPath(cameFrom, currentKey, start) {
  const path = [];
  let curr = currentKey;

  while (curr) {
    const tile = keyToTile(curr);
    path.unshift(tile);
    curr = cameFrom.get(curr);
  }

  return path;
}

// ============================================
// Min Heap for Priority Queue
// ============================================

class MinHeap {
  constructor() {
    this.heap = [];
    this.keyToIndex = new Map();
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  has(key) {
    return this.keyToIndex.has(key);
  }

  insert(node, priority) {
    const entry = { node, priority };
    this.heap.push(entry);
    const index = this.heap.length - 1;
    this.keyToIndex.set(node.key, index);
    this._bubbleUp(index);
  }

  extractMin() {
    if (this.isEmpty()) return null;

    const min = this.heap[0].node;
    this.keyToIndex.delete(min.key);

    const last = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = last;
      this.keyToIndex.set(last.node.key, 0);
      this._bubbleDown(0);
    }

    return min;
  }

  decreaseKey(key, newPriority) {
    const index = this.keyToIndex.get(key);
    if (index === undefined) return;

    this.heap[index].priority = newPriority;
    this._bubbleUp(index);
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;

      this._swap(index, parentIndex);
      index = parentIndex;
    }
  }

  _bubbleDown(index) {
    const length = this.heap.length;

    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < length && this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < length && this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      this._swap(index, smallest);
      index = smallest;
    }
  }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    this.keyToIndex.set(this.heap[i].node.key, i);
    this.keyToIndex.set(this.heap[j].node.key, j);
  }
}

// ============================================
// Direction Utilities
// ============================================

/**
 * Get the cardinal direction from one point to another
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @returns {'up'|'down'|'left'|'right'}
 */
export function getDirection(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}

/**
 * Convert facing string from map data to direction
 * @param {string|null} facing - 'away' | 'toward' | null
 * @returns {'up'|'down'|null}
 */
export function facingToDirection(facing) {
  if (facing === 'away') return 'up';
  if (facing === 'toward') return 'down';
  return null;
}
