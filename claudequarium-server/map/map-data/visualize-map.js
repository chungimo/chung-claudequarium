#!/usr/bin/env node

const fs = require('fs');

/**
 * Visualize the collision grid and zones from parsed TMX data
 */

function visualizeCollisionGrid(mapData) {
  const { map, unifiedCollisionGrid, workstations, planningZones, idleZones, thinkingZones } = mapData;
  const { width, height, tileWidth, tileHeight } = map;
  
  // Create a character grid
  const grid = unifiedCollisionGrid.map(row => 
    row.map(blocked => blocked ? '█' : '·')
  );
  
  // Overlay workstations (W)
  for (const ws of workstations) {
    const tileX = Math.floor(ws.centerX / tileWidth);
    const tileY = Math.floor(ws.centerY / tileHeight);
    if (tileY >= 0 && tileY < height && tileX >= 0 && tileX < width) {
      grid[tileY][tileX] = ws.facing === 'away' ? '↑' : '↓';
    }
  }
  
  // Overlay planning zones (P)
  for (const zone of planningZones) {
    const tileX = Math.floor(zone.centerX / tileWidth);
    const tileY = Math.floor(zone.centerY / tileHeight);
    if (tileY >= 0 && tileY < height && tileX >= 0 && tileX < width) {
      grid[tileY][tileX] = 'P';
    }
  }
  
  // Overlay thinking zones (T)
  for (const zone of thinkingZones) {
    const startX = Math.floor(zone.x / tileWidth);
    const endX = Math.ceil((zone.x + zone.width) / tileWidth);
    const tileY = Math.floor(zone.centerY / tileHeight);
    
    for (let x = startX; x < endX && x < width; x++) {
      if (tileY >= 0 && tileY < height && x >= 0) {
        if (grid[tileY][x] === '·') grid[tileY][x] = 't';
      }
    }
  }
  
  // Overlay idle zones (mark corners with I)
  for (const zone of idleZones) {
    const startX = Math.floor(zone.x / tileWidth);
    const startY = Math.floor(zone.y / tileHeight);
    const endX = Math.ceil((zone.x + zone.width) / tileWidth) - 1;
    const endY = Math.ceil((zone.y + zone.height) / tileHeight) - 1;
    
    // Just mark the center
    const cx = Math.floor(zone.centerX / tileWidth);
    const cy = Math.floor(zone.centerY / tileHeight);
    if (cy >= 0 && cy < height && cx >= 0 && cx < width) {
      if (grid[cy][cx] === '·') grid[cy][cx] = 'i';
    }
  }
  
  return grid;
}

function printGrid(grid) {
  // Column numbers
  const width = grid[0].length;
  
  // Header
  console.log('\n    ' + Array.from({ length: width }, (_, i) => (i % 10).toString()).join(''));
  console.log('    ' + '─'.repeat(width));
  
  // Rows
  grid.forEach((row, y) => {
    const rowNum = y.toString().padStart(2, ' ');
    console.log(`${rowNum} │ ${row.join('')}`);
  });
  
  // Legend
  console.log('\nLegend:');
  console.log('  █ = Collision/blocked');
  console.log('  · = Walkable');
  console.log('  ↑ = Workstation (facing away/up)');
  console.log('  ↓ = Workstation (facing toward/down)');
  console.log('  P = Planning zone (whiteboard)');
  console.log('  t = Thinking zone');
  console.log('  i = Idle zone center');
}

function printSummary(mapData) {
  console.log('\n═══════════════════════════════════════');
  console.log('           MAP DATA SUMMARY            ');
  console.log('═══════════════════════════════════════\n');
  
  console.log(`Map: ${mapData.map.width}x${mapData.map.height} tiles (${mapData.map.pixelWidth}x${mapData.map.pixelHeight}px)`);
  console.log(`Tile size: ${mapData.map.tileWidth}x${mapData.map.tileHeight}px\n`);
  
  console.log(`Workstations: ${mapData.workstations.length}`);
  mapData.workstations.forEach(ws => {
    console.log(`  • ${ws.id} @ (${ws.centerX}, ${ws.centerY}) facing ${ws.facing}`);
  });
  
  console.log(`\nPlanning Zones: ${mapData.planningZones.length}`);
  mapData.planningZones.forEach(z => {
    console.log(`  • ${z.id} @ (${z.centerX}, ${z.centerY})`);
  });
  
  console.log(`\nThinking Zones: ${mapData.thinkingZones.length}`);
  mapData.thinkingZones.forEach(z => {
    console.log(`  • ${z.id} (${z.width}x${z.height}px)`);
  });
  
  console.log(`\nIdle Zones: ${mapData.idleZones.length}`);
  mapData.idleZones.forEach(z => {
    console.log(`  • ${z.id} (${z.width}x${z.height}px)`);
  });
  
  console.log(`\nCollision Rects: ${mapData.collisionRects.length}`);
}

// CLI
if (require.main === module) {
  const jsonPath = process.argv[2];
  
  if (!jsonPath) {
    console.error('Usage: node visualize-map.js <path-to-parsed-map.json>');
    process.exit(1);
  }
  
  const mapData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  
  printSummary(mapData);
  
  console.log('\n═══════════════════════════════════════');
  console.log('         COLLISION GRID VIEW           ');
  console.log('═══════════════════════════════════════');
  
  const grid = visualizeCollisionGrid(mapData);
  printGrid(grid);
}

module.exports = { visualizeCollisionGrid };
