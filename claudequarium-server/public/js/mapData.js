// Map Data Module
// Handles loading and accessing parsed Tiled map data
// Provides a clean interface to zones, collision data, and map properties

let mapData = null;
let isLoaded = false;
let loadPromise = null;

/**
 * Load map data from JSON file
 * @returns {Promise<object>} The loaded map data
 */
export async function loadMapData() {
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/data/mapData.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load map data: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      mapData = data;
      isLoaded = true;
      console.log('Map data loaded:', {
        dimensions: `${data.map.pixelWidth}x${data.map.pixelHeight}`,
        workstations: data.workstations.length,
        planningZones: data.planningZones.length,
        thinkingZones: data.thinkingZones.length,
        idleZones: data.idleZones.length
      });
      return data;
    });

  return loadPromise;
}

/**
 * Check if map data is loaded
 * @returns {boolean}
 */
export function isMapLoaded() {
  return isLoaded;
}

/**
 * Get raw map data (for advanced use cases)
 * @returns {object|null}
 */
export function getMapData() {
  return mapData;
}

// ============================================
// Map Properties
// ============================================

export function getMapDimensions() {
  if (!mapData) return null;
  return {
    width: mapData.map.pixelWidth,
    height: mapData.map.pixelHeight,
    tileWidth: mapData.map.tileWidth,
    tileHeight: mapData.map.tileHeight,
    tilesX: mapData.map.width,
    tilesY: mapData.map.height
  };
}

// ============================================
// Zone Access
// ============================================

/**
 * Get all zones of a specific type
 * @param {string} type - 'workstations' | 'planningZones' | 'thinkingZones' | 'idleZones'
 * @returns {Array}
 */
export function getZonesByType(type) {
  if (!mapData) return [];
  return mapData[type] || [];
}

/**
 * Get zones for a given game state
 * @param {string} state - Game state (CODING, PLANNING, THINKING, IDLE)
 * @returns {Array}
 */
export function getZonesForState(state) {
  const stateToZoneType = {
    CODING: 'workstations',
    PLANNING: 'planningZones',
    THINKING: 'thinkingZones',
    IDLE: 'idleZones'
  };

  const zoneType = stateToZoneType[state];
  if (!zoneType) return [];

  return getZonesByType(zoneType);
}

/**
 * Get a specific zone by ID
 * @param {string} id - Zone ID
 * @returns {object|null}
 */
export function getZoneById(id) {
  if (!mapData) return null;

  const allZones = [
    ...mapData.workstations,
    ...mapData.planningZones,
    ...mapData.thinkingZones,
    ...mapData.idleZones
  ];

  return allZones.find(zone => zone.id === id) || null;
}

/**
 * Get a random point within a zone (for idle wandering)
 * @param {object} zone - Zone object with x, y, width, height
 * @param {number} padding - Distance from edges (default 8px)
 * @returns {{x: number, y: number}}
 */
export function getRandomPointInZone(zone, padding = 8) {
  return {
    x: zone.x + padding + Math.random() * (zone.width - padding * 2),
    y: zone.y + padding + Math.random() * (zone.height - padding * 2)
  };
}

// ============================================
// Collision Grid Access
// ============================================

/**
 * Get the unified collision grid
 * @returns {boolean[][]|null} 2D array where true = blocked
 */
export function getCollisionGrid() {
  if (!mapData) return null;
  return mapData.unifiedCollisionGrid;
}

/**
 * Check if a tile coordinate is walkable
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {boolean}
 */
export function isTileWalkable(tileX, tileY) {
  if (!mapData) return false;

  const grid = mapData.unifiedCollisionGrid;
  const dims = mapData.map;

  // Out of bounds check
  if (tileX < 0 || tileX >= dims.width || tileY < 0 || tileY >= dims.height) {
    return false;
  }

  // true in grid means blocked, so we return !blocked
  return !grid[tileY][tileX];
}

/**
 * Check if a pixel coordinate is walkable
 * @param {number} pixelX - Pixel X coordinate
 * @param {number} pixelY - Pixel Y coordinate
 * @returns {boolean}
 */
export function isPixelWalkable(pixelX, pixelY) {
  const tile = pixelToTile(pixelX, pixelY);
  return isTileWalkable(tile.x, tile.y);
}

// ============================================
// Coordinate Conversion
// ============================================

/**
 * Convert pixel coordinates to tile coordinates
 * @param {number} pixelX
 * @param {number} pixelY
 * @returns {{x: number, y: number}}
 */
export function pixelToTile(pixelX, pixelY) {
  if (!mapData) return { x: 0, y: 0 };

  return {
    x: Math.floor(pixelX / mapData.map.tileWidth),
    y: Math.floor(pixelY / mapData.map.tileHeight)
  };
}

/**
 * Convert tile coordinates to pixel coordinates (center of tile)
 * @param {number} tileX
 * @param {number} tileY
 * @returns {{x: number, y: number}}
 */
export function tileToPixel(tileX, tileY) {
  if (!mapData) return { x: 0, y: 0 };

  return {
    x: tileX * mapData.map.tileWidth + mapData.map.tileWidth / 2,
    y: tileY * mapData.map.tileHeight + mapData.map.tileHeight / 2
  };
}

/**
 * Get tile coordinates for a zone's center
 * @param {object} zone - Zone object with centerX, centerY
 * @returns {{x: number, y: number}}
 */
export function getZoneCenterTile(zone) {
  return pixelToTile(zone.centerX, zone.centerY);
}

// ============================================
// Spawn Point
// ============================================

/**
 * Get a valid spawn point (finds walkable area near map edge)
 * @returns {{x: number, y: number}} Pixel coordinates
 */
export function getSpawnPoint() {
  if (!mapData) return { x: 100, y: 100 };

  // Default spawn: right side of the thinking zone area
  // Find first walkable tile from the right side
  const dims = mapData.map;

  // Try to find a walkable spot on the right side of the main area
  for (let x = dims.width - 3; x >= dims.width / 2; x--) {
    for (let y = 3; y < dims.height - 3; y++) {
      if (isTileWalkable(x, y)) {
        const pixel = tileToPixel(x, y);
        return pixel;
      }
    }
  }

  // Fallback to center of first idle zone
  const idleZones = getZonesByType('idleZones');
  if (idleZones.length > 0) {
    return { x: idleZones[0].centerX, y: idleZones[0].centerY };
  }

  return { x: dims.pixelWidth / 2, y: dims.pixelHeight / 2 };
}
