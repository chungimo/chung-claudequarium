# Claudequarium - Map System Implementation Guide

## Project Context

This is a browser-based visualization system where Claude Code agent instances appear as animated pixel art characters working in a virtual office. Agents move between workstations, whiteboards, and idle areas based on their current activity state (coding, planning, thinking, idle).

The map is authored in **Tiled Map Editor** and exported as `.tmx` (XML format). A Node.js parser extracts game-relevant data into JSON for runtime use.

---

## Map Architecture

### Source File
- **Format:** TMX (Tiled XML)
- **Dimensions:** 25×20 tiles at 48×48px = 1200×960px total
- **Orientation:** Orthogonal top-down

### Tilesets Used
1. `Modern_Office_Black_Shadow_48x48.png` — Furniture with drop shadows
2. `Room_Builder_Office_48x48.png` — Walls, floors, structural elements (has collision properties baked in)
3. Custom ChatGPT-generated tileset — Additional assets
4. `server_racks_added.png` — Server room equipment

### Layer Structure (render order bottom-to-top)
```
OOB                        → Legacy bounds markers (can ignore)
Building                   → Walls, floors, structure
Office_Bottom              → Lower furniture in private offices
Office_Bottom_Chair        → Chairs (separate for depth sorting)
Office_Bottom_Stuff        → Desktop items, decorations
Office_Decor               → Plants, wall art, shelving
Cubes                      → Cubicle partition walls
Desks-FacingAway           → Workstation desks (back row)
Desks-Chairs-FacingAway    → Workstation chairs
Desks-Objects-FacingToward → Monitors, items on forward-facing desks
Servers                    → Server room racks
```

---

## Zone System (Object Layers)

The map uses **Tiled Object Layers** to define interactive zones. These are invisible rectangles that mark where agents can perform specific activities.

### Zone Types

| Layer Name | Purpose | Agent State |
|------------|---------|-------------|
| `ZONE-WORKING-*` | Desk/chair positions for coding | `CODING` |
| `ZONE-PLANNING` | Whiteboard areas | `PLANNING` |
| `ZONE-THINKING` | Pacing/contemplation corridor | `THINKING` |
| `ZONE-IDLE` | Wandering/waiting areas | `IDLE` |
| `ZONE-COLLISION` | Obstacle rectangles for pathfinding | N/A |

### Naming Convention
Zone objects follow this pattern:
```
{type}-{availability}-{facing}-{id}
```

Examples:
- `chair-available-cube-facing-away1` → Cubicle workstation, sprite faces up
- `whiteboard-available-facingaway-2` → Planning zone, sprite faces up
- `idle-zone-3` → General idle area, no facing constraint

### Facing Direction
- `facing-away` or `facingaway` → Sprite faces UP (back to camera) — use `away` direction sprites
- `facing-toward` or `facingtoward` → Sprite faces DOWN (toward camera) — use `toward` direction sprites
- No facing specified → Agent can face any direction (typically for idle zones)

---

## Collision System

Collision is defined two ways, merged at runtime:

### 1. Tile Properties (Tileset-level)
The `Room_Builder_Office_48x48` tileset has `collision: true` set on wall tiles (IDs 0-42+). The parser reads these and builds a tile-based grid.

### 2. Object Rectangles (ZONE-COLLISION layer)
Manual collision shapes for furniture, decorations, and irregular obstacles. These are converted to tile coordinates and merged with the tile-based grid.

### Unified Collision Grid
The parser outputs `unifiedCollisionGrid` — a 2D boolean array where:
- `true` = blocked (wall, furniture, out of bounds)
- `false` = walkable

```js
// Check if tile is walkable
function canWalk(tileX, tileY) {
  return !mapData.unifiedCollisionGrid[tileY]?.[tileX];
}
```

---

## Parser Output Structure

Running `node parse-map.js office_space.tmx` produces:

```js
{
  map: {
    width: 25,              // tiles
    height: 20,             // tiles
    tileWidth: 48,          // px
    tileHeight: 48,         // px
    pixelWidth: 1200,       // total px
    pixelHeight: 960        // total px
  },

  workstations: [
    {
      id: "chair-available-cube-facing-away1",
      x: 189,               // px (top-left of zone)
      y: 396,
      width: 55,            // px
      height: 49,
      centerX: 216.5,       // px (use for sprite positioning)
      centerY: 420.5,
      facing: "away",       // sprite direction
      type: "cubicle"       // inferred from name
    },
    // ...
  ],

  planningZones: [
    {
      id: "whiteboard-available-facingaway-1",
      x: 150, y: 97,
      width: 82, height: 43,
      centerX: 191, centerY: 118.5,
      facing: "away"
    },
    // ...
  ],

  thinkingZones: [
    {
      id: "ThinkingZone-Available-1",
      x: 57, y: 153,
      width: 660, height: 101,
      centerX: 387, centerY: 203.5,
      facing: null          // no constraint
    }
  ],

  idleZones: [
    {
      id: "idle-zone-1",
      x: 784, y: 124,
      width: 221, height: 114,
      centerX: 894.5, centerY: 181,
      facing: null
    },
    // ...
  ],

  collisionRects: [
    { id: "col-desk-right", x: 528, y: 319, width: 284, height: 98 },
    // ... 25 total
  ],

  collisionGrid: [[...], ...],        // tile-property based only
  unifiedCollisionGrid: [[...], ...]  // merged (USE THIS ONE)
}
```

---

## Implementation Notes

### Agent State → Zone Mapping

```js
const STATE_ZONES = {
  CODING:   'workstations',
  PLANNING: 'planningZones', 
  THINKING: 'thinkingZones',
  IDLE:     'idleZones'
};

function getZonesForState(state) {
  return mapData[STATE_ZONES[state]] || [];
}
```

### Assigning Agents to Workstations

Workstations should be claimed exclusively (one agent per desk):

```js
const occupiedWorkstations = new Set();

function claimWorkstation(agentId) {
  const available = mapData.workstations.find(ws => 
    !occupiedWorkstations.has(ws.id)
  );
  if (available) {
    occupiedWorkstations.add(available.id);
    return available;
  }
  return null;
}

function releaseWorkstation(workstationId) {
  occupiedWorkstations.delete(workstationId);
}
```

### Sprite Positioning

Use `centerX`/`centerY` for sprite anchor point. The facing direction determines which sprite row to use:

```js
function positionAgentAtZone(agent, zone) {
  agent.x = zone.centerX;
  agent.y = zone.centerY;
  
  if (zone.facing === 'away') {
    agent.direction = 'up';      // back to camera
  } else if (zone.facing === 'toward') {
    agent.direction = 'down';    // facing camera
  }
  // else: keep current direction or pick random
}
```

### Pathfinding Integration

The `unifiedCollisionGrid` is ready for A* or similar:

```js
function isWalkable(tileX, tileY) {
  if (tileX < 0 || tileX >= mapData.map.width) return false;
  if (tileY < 0 || tileY >= mapData.map.height) return false;
  return !mapData.unifiedCollisionGrid[tileY][tileX];
}

function pixelToTile(px, py) {
  return {
    x: Math.floor(px / mapData.map.tileWidth),
    y: Math.floor(py / mapData.map.tileHeight)
  };
}

function tileToPixel(tx, ty) {
  return {
    x: tx * mapData.map.tileWidth + mapData.map.tileWidth / 2,
    y: ty * mapData.map.tileHeight + mapData.map.tileHeight / 2
  };
}
```

### Random Position Within Zone

For idle/thinking zones where agents wander:

```js
function randomPointInZone(zone) {
  const padding = 8; // keep sprites away from edges
  return {
    x: zone.x + padding + Math.random() * (zone.width - padding * 2),
    y: zone.y + padding + Math.random() * (zone.height - padding * 2)
  };
}
```

---

## Visual Debug Tool

Run `node visualize-map.js office_space_data.json` to see ASCII representation:

```
    0123456789012345678901234
 0 │ █████████████████████████
 1 │ █████████████████████████
 2 │ ██·P···P··P··P·█···██··██   ← Whiteboards (P)
 3 │ █··············█··i··████   ← Idle zone (i)
 4 │ █tttttttttttttt······████   ← Thinking corridor (t)
 5 │ █······················██
 6 │ █··█↑██↑█··█↑██↑█·······█   ← Workstations (↑)
 7 │ █··██████··██████··i·····
 8 │ █··█↑██↑█··█↑██↑█········   ← Workstations (↑)
 9 │ █··················███··█
```

---

## File Manifest

| File | Purpose |
|------|---------|
| `office_space.tmx` | Source map (edit in Tiled) |
| `parse-map.js` | TMX → JSON parser |
| `visualize-map.js` | ASCII debug visualization |
| `office_space_data.json` | Pre-parsed map data |

---

## Extending the Map

To add new zones in Tiled:

1. Create/select appropriate Object Layer (e.g., `ZONE-WORKING-*`)
2. Draw rectangle where agents should stand
3. Name it following convention: `{type}-available-{facing}-{id}`
4. Re-run parser: `node parse-map.js office_space.tmx > office_space_data.json`

To add collision:

1. Select `ZONE-COLLISION` layer
2. Draw rectangles over obstacles
3. Re-run parser

The parser automatically handles both tile-property collisions and object-layer collisions.

---

## Current Zone Inventory

- **8 workstations** — 4 facing-away in back row, 4 facing-away in front row
- **4 planning zones** — Whiteboards along top wall
- **1 thinking zone** — Horizontal corridor for pacing
- **5 idle zones** — Scattered throughout walkable areas
- **25 collision rects** — Walls, furniture, decorations
