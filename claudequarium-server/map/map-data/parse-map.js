#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * TMX Map Parser for Office Space Game
 * Extracts zones, collision data, and workstation positions from Tiled maps
 */

class TMXParser {
  constructor(tmxPath) {
    this.tmxPath = tmxPath;
    this.raw = fs.readFileSync(tmxPath, 'utf-8');
    this.map = {};
    this.tilesets = [];
    this.tileProperties = new Map(); // gid -> properties
    this.layers = [];
    this.objectGroups = [];
  }

  parse() {
    this.parseMapAttributes();
    this.parseTilesets();
    this.parseTileLayers();
    this.parseObjectGroups();
    return this.buildOutput();
  }

  // Extract map attributes from the root <map> element
  parseMapAttributes() {
    const mapMatch = this.raw.match(/<map[^>]+>/);
    if (!mapMatch) throw new Error('Invalid TMX: no <map> element found');
    
    const attrs = this.parseAttributes(mapMatch[0]);
    this.map = {
      width: parseInt(attrs.width),
      height: parseInt(attrs.height),
      tileWidth: parseInt(attrs.tilewidth),
      tileHeight: parseInt(attrs.tileheight),
      orientation: attrs.orientation || 'orthogonal'
    };
    
    // Calculate pixel dimensions
    this.map.pixelWidth = this.map.width * this.map.tileWidth;
    this.map.pixelHeight = this.map.height * this.map.tileHeight;
  }

  // Parse all tilesets and their tile properties
  parseTilesets() {
    const tilesetRegex = /<tileset[^>]*>[\s\S]*?<\/tileset>|<tileset[^/]*\/>/g;
    const tilesetMatches = this.raw.match(tilesetRegex) || [];

    for (const tilesetXml of tilesetMatches) {
      const attrs = this.parseAttributes(tilesetXml.match(/<tileset[^>]*/)[0]);
      const firstgid = parseInt(attrs.firstgid);
      
      const tileset = {
        firstgid,
        name: attrs.name,
        tileWidth: parseInt(attrs.tilewidth),
        tileHeight: parseInt(attrs.tileheight),
        tileCount: parseInt(attrs.tilecount) || 0
      };

      // Parse tile properties within this tileset
      const tileRegex = /<tile\s+id="(\d+)"[^>]*>[\s\S]*?<\/tile>/g;
      let tileMatch;
      while ((tileMatch = tileRegex.exec(tilesetXml)) !== null) {
        const localId = parseInt(tileMatch[1]);
        const gid = firstgid + localId;
        
        const properties = this.parseProperties(tileMatch[0]);
        if (Object.keys(properties).length > 0) {
          this.tileProperties.set(gid, properties);
        }
      }

      this.tilesets.push(tileset);
    }
  }

  // Parse tile layers (for building collision grid from tile properties)
  parseTileLayers() {
    const layerRegex = /<layer[^>]*>[\s\S]*?<\/layer>/g;
    const layerMatches = this.raw.match(layerRegex) || [];

    for (const layerXml of layerMatches) {
      const attrs = this.parseAttributes(layerXml.match(/<layer[^>]*/)[0]);
      
      // Extract CSV data
      const dataMatch = layerXml.match(/<data[^>]*>([\s\S]*?)<\/data>/);
      if (!dataMatch) continue;

      const tiles = dataMatch[1]
        .trim()
        .split(',')
        .map(t => parseInt(t.trim()));

      this.layers.push({
        id: parseInt(attrs.id),
        name: attrs.name,
        width: parseInt(attrs.width),
        height: parseInt(attrs.height),
        tiles
      });
    }
  }

  // Parse object groups (zones)
  parseObjectGroups() {
    const groupRegex = /<objectgroup[^>]*>[\s\S]*?<\/objectgroup>/g;
    const groupMatches = this.raw.match(groupRegex) || [];

    for (const groupXml of groupMatches) {
      const attrs = this.parseAttributes(groupXml.match(/<objectgroup[^>]*/)[0]);
      
      const objects = [];
      const objectRegex = /<object\s+[^>]*\/?>/g;
      let objMatch;
      
      while ((objMatch = objectRegex.exec(groupXml)) !== null) {
        const objAttrs = this.parseAttributes(objMatch[0]);
        
        // Skip if no id (shouldn't happen) or no dimensions (point object without size)
        if (!objAttrs.id) continue;
        
        // Only include objects with actual dimensions or a gid (tile objects)
        const hasSize = (parseFloat(objAttrs.width) > 0 && parseFloat(objAttrs.height) > 0);
        const isTileObj = !!objAttrs.gid;
        
        if (!hasSize && !isTileObj) continue;
        
        objects.push({
          id: parseInt(objAttrs.id),
          name: objAttrs.name || null,
          x: parseFloat(objAttrs.x) || 0,
          y: parseFloat(objAttrs.y) || 0,
          width: parseFloat(objAttrs.width) || 0,
          height: parseFloat(objAttrs.height) || 0,
          gid: objAttrs.gid ? parseInt(objAttrs.gid) : null,
          visible: objAttrs.visible !== '0'
        });
      }

      this.objectGroups.push({
        id: parseInt(attrs.id),
        name: attrs.name,
        objects
      });
    }
  }

  // Parse properties from a block of XML
  parseProperties(xml) {
    const props = {};
    const propRegex = /<property\s+name="([^"]+)"\s+(?:type="([^"]+)"\s+)?value="([^"]*)"/g;
    let match;
    
    while ((match = propRegex.exec(xml)) !== null) {
      const [, name, type, value] = match;
      props[name] = this.castValue(value, type);
    }
    
    return props;
  }

  // Parse XML attributes into an object
  parseAttributes(tag) {
    const attrs = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let match;
    
    while ((match = attrRegex.exec(tag)) !== null) {
      attrs[match[1]] = match[2];
    }
    
    return attrs;
  }

  // Cast string value to appropriate type
  castValue(value, type) {
    switch (type) {
      case 'bool': return value === 'true';
      case 'int': return parseInt(value);
      case 'float': return parseFloat(value);
      default: return value;
    }
  }

  // Build the final output structure
  buildOutput() {
    const output = {
      map: this.map,
      
      // Workstations with facing direction
      workstations: this.extractWorkstations(),
      
      // Planning zones (whiteboards)
      planningZones: this.extractZonesByPrefix('ZONE-PLANNING'),
      
      // Idle/wandering zones
      idleZones: this.extractZonesByPrefix('ZONE-IDLE'),
      
      // Thinking zones
      thinkingZones: this.extractZonesByPrefix('ZONE-THINKING'),
      
      // All collision rectangles
      collisionRects: this.extractCollisionRects(),
      
      // Tile-based collision grid (from tile properties)
      collisionGrid: this.buildCollisionGrid()
    };

    return output;
  }

  // Extract workstations with facing direction from zone name
  extractWorkstations() {
    const workstations = [];
    
    for (const group of this.objectGroups) {
      if (!group.name.startsWith('ZONE-WORKING')) continue;
      
      // Determine facing from layer name
      const layerFacing = group.name.includes('facing-away') ? 'away' : 
                          group.name.includes('facing-toward') ? 'toward' : 'away';
      
      for (const obj of group.objects) {
        // Parse facing from object name if present
        let facing = layerFacing;
        if (obj.name) {
          if (obj.name.includes('facing-away') || obj.name.includes('facingaway')) {
            facing = 'away';
          } else if (obj.name.includes('facing-toward') || obj.name.includes('facingtoward')) {
            facing = 'toward';
          }
        }

        workstations.push({
          id: obj.name || `workstation-${obj.id}`,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          // Center point for sprite positioning
          centerX: obj.x + obj.width / 2,
          centerY: obj.y + obj.height / 2,
          facing,
          type: this.inferWorkstationType(group.name, obj.name)
        });
      }
    }

    return workstations;
  }

  // Infer workstation type from naming
  inferWorkstationType(layerName, objName) {
    const combined = `${layerName} ${objName || ''}`.toLowerCase();
    if (combined.includes('cube')) return 'cubicle';
    if (combined.includes('office')) return 'private-office';
    if (combined.includes('chair')) return 'desk';
    return 'desk';
  }

  // Extract zones by layer name prefix
  extractZonesByPrefix(prefix) {
    const zones = [];
    
    for (const group of this.objectGroups) {
      if (!group.name.startsWith(prefix)) continue;
      
      for (const obj of group.objects) {
        // Parse facing from object name
        let facing = null;
        if (obj.name) {
          if (obj.name.includes('facingaway') || obj.name.includes('facing-away')) {
            facing = 'away';
          } else if (obj.name.includes('facingtoward') || obj.name.includes('facing-toward')) {
            facing = 'toward';
          }
        }

        zones.push({
          id: obj.name || `zone-${obj.id}`,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          centerX: obj.x + obj.width / 2,
          centerY: obj.y + obj.height / 2,
          facing
        });
      }
    }

    return zones;
  }

  // Extract collision rectangles from ZONE-COLLISION
  extractCollisionRects() {
    const rects = [];
    
    for (const group of this.objectGroups) {
      if (group.name !== 'ZONE-COLLISION') continue;
      
      for (const obj of group.objects) {
        // Skip tile objects (gid present) - handle separately if needed
        if (obj.gid) continue;
        
        rects.push({
          id: obj.name || `collision-${obj.id}`,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height
        });
      }
    }

    return rects;
  }

  // Build a tile-based collision grid from tile properties
  buildCollisionGrid() {
    const grid = [];
    const { width, height } = this.map;

    // Initialize grid with false (walkable)
    for (let y = 0; y < height; y++) {
      grid[y] = new Array(width).fill(false);
    }

    // Check each layer for tiles with collision property
    for (const layer of this.layers) {
      for (let i = 0; i < layer.tiles.length; i++) {
        const gid = layer.tiles[i];
        if (gid === 0) continue;

        const props = this.tileProperties.get(gid);
        if (props && props.collision === true) {
          const x = i % width;
          const y = Math.floor(i / width);
          grid[y][x] = true;
        }
      }
    }

    return grid;
  }
}

/**
 * Helper: Convert collision grid to A* compatible format
 */
function gridToPathfindingNodes(grid, tileWidth, tileHeight) {
  const nodes = [];
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (!grid[y][x]) { // Only walkable tiles
        nodes.push({
          x: x * tileWidth + tileWidth / 2,
          y: y * tileHeight + tileHeight / 2,
          tileX: x,
          tileY: y
        });
      }
    }
  }
  
  return nodes;
}

/**
 * Helper: Check if a point is inside any collision rect
 */
function isPointBlocked(x, y, collisionRects) {
  for (const rect of collisionRects) {
    if (x >= rect.x && x <= rect.x + rect.width &&
        y >= rect.y && y <= rect.y + rect.height) {
      return true;
    }
  }
  return false;
}

/**
 * Helper: Merge rect-based and tile-based collision into unified grid
 */
function buildUnifiedCollisionGrid(mapData) {
  const { map, collisionGrid, collisionRects } = mapData;
  const { width, height, tileWidth, tileHeight } = map;
  
  // Clone the tile-based grid
  const unified = collisionGrid.map(row => [...row]);
  
  // Overlay rect-based collisions
  for (const rect of collisionRects) {
    const startX = Math.floor(rect.x / tileWidth);
    const startY = Math.floor(rect.y / tileHeight);
    const endX = Math.ceil((rect.x + rect.width) / tileWidth);
    const endY = Math.ceil((rect.y + rect.height) / tileHeight);
    
    for (let y = startY; y < endY && y < height; y++) {
      for (let x = startX; x < endX && x < width; x++) {
        if (x >= 0 && y >= 0) {
          unified[y][x] = true;
        }
      }
    }
  }
  
  return unified;
}

// CLI execution
if (require.main === module) {
  const tmxPath = process.argv[2];
  
  if (!tmxPath) {
    console.error('Usage: node parse-map.js <path-to-map.tmx>');
    process.exit(1);
  }

  try {
    const parser = new TMXParser(tmxPath);
    const mapData = parser.parse();
    
    // Add unified collision grid
    mapData.unifiedCollisionGrid = buildUnifiedCollisionGrid(mapData);
    
    // Output as JSON
    console.log(JSON.stringify(mapData, null, 2));
    
  } catch (err) {
    console.error('Error parsing TMX:', err.message);
    process.exit(1);
  }
}

module.exports = { 
  TMXParser, 
  gridToPathfindingNodes, 
  isPointBlocked, 
  buildUnifiedCollisionGrid 
};
