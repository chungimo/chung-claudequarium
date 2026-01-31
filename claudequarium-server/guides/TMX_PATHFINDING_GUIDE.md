# Pathfinding in Tile-Based Games

This document explains how to implement pathfinding for NPCs navigating around obstacles in a 2D tile-based game. We'll cover the tilemap system, the A* algorithm, and how entities follow calculated paths.

---

## Table of Contents

1. [The Tilemap Foundation](#the-tilemap-foundation)
2. [Coordinate Systems](#coordinate-systems)
3. [A* Pathfinding Algorithm](#a-pathfinding-algorithm)
4. [Following a Path](#following-a-path)
5. [Collision Detection](#collision-detection)
6. [Common Enhancements](#common-enhancements)

---

## The Tilemap Foundation

A tilemap is a 2D grid where each cell represents a fixed-size area of your game world. Each tile has a type that determines its properties.

### Defining the Map

```javascript
const TILE_SIZE = 32;  // pixels per tile
const MAP_WIDTH = 20;  // tiles
const MAP_HEIGHT = 15; // tiles

// Tile types
const FLOOR = 0;      // walkable
const WALL = 1;       // blocked
const DESK = 2;       // blocked (furniture)
const DESK_CHAIR = 3; // walkable (NPC destination)

const tilemap = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,2,2,0,0,0,0,1],  // 2 = desk (blocked)
  [1,0,0,3,0,0,0,0,0,1],  // 3 = chair (destination)
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1],
];
```

### Visual Representation

```
████████████████████████████████
█                              █
█        ██████                █
█        █DESK█                █
█        ██████                █
█          ◇ ← chair/destination
█                              █
████████████████████████████████

█ = wall (blocked)
  = floor (walkable)
◇ = destination point
```

### Checking Walkability

```javascript
function isWalkable(tileX, tileY) {
  // Out of bounds = not walkable
  if (tileX < 0 || tileX >= MAP_WIDTH || 
      tileY < 0 || tileY >= MAP_HEIGHT) {
    return false;
  }
  
  const tile = tilemap[tileY][tileX];
  return tile === FLOOR || tile === DESK_CHAIR;
}
```

---

## Coordinate Systems

There are two coordinate systems that must be converted between:

| System | Unit | Use Case |
|--------|------|----------|
| **World Space** | Pixels | Entity positions, rendering, smooth movement |
| **Tile Space** | Tile indices | Pathfinding, collision grid, map data |

### Conversion Functions

```javascript
// World pixels → Tile coordinates
function worldToTile(worldX, worldY) {
  return {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE)
  };
}

// Tile coordinates → World pixels (center of tile)
function tileToWorld(tileX, tileY) {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2
  };
}
```

### Visual Example

```
Tile (2, 1) in a 32px grid:

World coordinates:
  Top-left:  (64, 32)
  Center:    (80, 48)  ← tileToWorld returns this
  Bottom-right: (95, 63)

    0       32       64       96
    ├────────┼────────┼────────┤
 0  │ (0,0)  │ (1,0)  │ (2,0)  │
    ├────────┼────────┼────────┤
32  │ (0,1)  │ (1,1)  │ (2,1)  │ ← this tile
    ├────────┼────────┼────────┤
64  │ (0,2)  │ (1,2)  │ (2,2)  │
```

---

## A* Pathfinding Algorithm

A* (pronounced "A-star") finds the shortest path between two points while avoiding obstacles. It's the industry standard for game pathfinding.

### Core Concept

A* maintains two values for each tile:

- **g score**: The actual cost to reach this tile from the start
- **h score**: The estimated cost from this tile to the goal (heuristic)
- **f score**: g + h (total estimated cost)

The algorithm always explores the tile with the lowest f score, efficiently guiding the search toward the goal.

### The Heuristic Function

The heuristic estimates remaining distance. For grid movement, Manhattan distance works well:

```javascript
function heuristic(a, b) {
  // Manhattan distance: |x1-x2| + |y1-y2|
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

Why Manhattan? It matches 4-directional grid movement (no diagonals):

```
Manhattan distance from A to B = 5

  A · · ·      A→→→↓
  · · · ·  =   · · ·↓   (3 right + 2 down)
  · · · B      · · ·B
```

### The Algorithm

```javascript
function findPath(startTile, goalTile) {
  const openSet = [];      // Tiles to evaluate
  const closedSet = new Set();  // Already evaluated
  const cameFrom = new Map();   // To reconstruct path
  
  const gScore = new Map();
  const fScore = new Map();
  
  // Initialize start tile
  const startKey = `${startTile.x},${startTile.y}`;
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startTile, goalTile));
  openSet.push({ ...startTile, key: startKey });
  
  // 4-directional neighbors
  const neighbors = [
    { dx: 0, dy: -1 },  // up
    { dx: 0, dy: 1 },   // down
    { dx: -1, dy: 0 },  // left
    { dx: 1, dy: 0 }    // right
  ];
  
  while (openSet.length > 0) {
    // Get tile with lowest f score
    openSet.sort((a, b) => fScore.get(a.key) - fScore.get(b.key));
    const current = openSet.shift();
    
    // Reached goal?
    if (current.x === goalTile.x && current.y === goalTile.y) {
      return reconstructPath(cameFrom, current.key);
    }
    
    closedSet.add(current.key);
    
    // Explore neighbors
    for (const { dx, dy } of neighbors) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const neighborKey = `${nx},${ny}`;
      
      // Skip if blocked or already evaluated
      if (!isWalkable(nx, ny) || closedSet.has(neighborKey)) {
        continue;
      }
      
      const tentativeG = gScore.get(current.key) + 1;
      
      // Is this a better path to this neighbor?
      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, current.key);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + heuristic({x: nx, y: ny}, goalTile));
        
        if (!openSet.find(n => n.key === neighborKey)) {
          openSet.push({ x: nx, y: ny, key: neighborKey });
        }
      }
    }
  }
  
  return null;  // No path found
}

function reconstructPath(cameFrom, currentKey) {
  const path = [];
  let curr = currentKey;
  
  while (curr) {
    const [x, y] = curr.split(',').map(Number);
    path.unshift({ x, y });
    curr = cameFrom.get(curr);
  }
  
  return path;
}
```

### Step-by-Step Visualization

```
Finding path from S to G, avoiding obstacle:

Step 1: Start          Step 2: Expand         Step 3: Continue
┌───┬───┬───┬───┐     ┌───┬───┬───┬───┐     ┌───┬───┬───┬───┐
│ S │ ? │███│ G │     │ S │ 1 │███│ G │     │ S │ 1 │███│ G │
├───┼───┼───┼───┤     ├───┼───┼───┼───┤     ├───┼───┼───┼───┤
│ ? │   │███│   │     │ 1 │   │███│   │     │ 1 │ 2 │███│   │
├───┼───┼───┼───┤     ├───┼───┼───┼───┤     ├───┼───┼───┼───┤
│   │   │   │   │     │   │   │   │   │     │   │ ? │   │   │
└───┴───┴───┴───┘     └───┴───┴───┴───┘     └───┴───┴───┴───┘

S = start (g=0)        Numbers = g score      ? = in open set
? = neighbors to check ███ = obstacle         
G = goal

Final path: S → down → right → right → down → right → up → up → G
```

### Why A* is Efficient

Unlike breadth-first search which explores equally in all directions, A* uses the heuristic to prioritize tiles closer to the goal:

```
Breadth-First (explores everything):

    3 3 3 3 3
    3 2 2 2 3
    3 2 1 2 3
    3 2 S 2 3
    3 3 3 3 3
    
A* (guided by heuristic toward goal G):

            G
          2 2
        2 1
      2 S
      
Much fewer tiles explored!
```

---

## Following a Path

Once A* returns a path (array of tile coordinates), the NPC needs to follow it smoothly.

### NPC Path-Following Logic

```javascript
class NPC {
  constructor(x, y) {
    this.x = x;           // World position
    this.y = y;
    this.speed = 2;
    this.path = null;     // Array of {x, y} tile coords
    this.pathIndex = 0;   // Current waypoint
  }
  
  goTo(tileX, tileY) {
    const startTile = worldToTile(this.x, this.y);
    const goalTile = { x: tileX, y: tileY };
    
    this.path = findPath(startTile, goalTile);
    this.pathIndex = 0;
  }
  
  update(deltaTime) {
    // No path or reached end
    if (!this.path || this.pathIndex >= this.path.length) {
      return;
    }
    
    // Get current target waypoint
    const targetTile = this.path[this.pathIndex];
    const target = tileToWorld(targetTile.x, targetTile.y);
    
    // Calculate direction to target
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.speed) {
      // Close enough - snap to waypoint and advance
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
    } else {
      // Move toward waypoint
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
  }
}
```

### Movement Visualization

```
Path: [(2,1), (3,1), (3,2), (3,3)]

Frame 1:        Frame 10:       Frame 20:       Frame 30:
┌───┬───┬───┐   ┌───┬───┬───┐   ┌───┬───┬───┐   ┌───┬───┬───┐
│   │ ● │ ◇ │   │   │  ●│ ◇ │   │   │   │ ◇ │   │   │   │ ◇ │
├───┼───┼───┤   ├───┼───┼───┤   ├───┼───┼───┤   ├───┼───┼───┤
│   │   │ ◇ │   │   │   │ ◇ │   │   │   │●◇ │   │   │   │ ◇ │
├───┼───┼───┤   ├───┼───┼───┤   ├───┼───┼───┤   ├───┼───┼───┤
│   │   │ ★ │   │   │   │ ★ │   │   │   │ ★ │   │   │   │●★ │
└───┴───┴───┘   └───┴───┴───┘   └───┴───┴───┘   └───┴───┴───┘

● = NPC (moves smoothly between waypoints)
◇ = waypoint (tile center)
★ = destination
```

---

## Collision Detection

For smooth movement, we need pixel-level collision detection in addition to tile-based pathfinding.

### Bounding Box Collision

Check all four corners of the entity's bounding box:

```javascript
update(deltaTime) {
  const newX = this.x + dx * this.speed;
  const newY = this.y + dy * this.speed;
  const halfSize = this.size / 2;
  
  // Check if X movement is valid
  const canMoveX = 
    isWalkable(Math.floor((newX - halfSize) / TILE_SIZE), 
               Math.floor((this.y - halfSize) / TILE_SIZE)) &&
    isWalkable(Math.floor((newX + halfSize) / TILE_SIZE), 
               Math.floor((this.y - halfSize) / TILE_SIZE)) &&
    isWalkable(Math.floor((newX - halfSize) / TILE_SIZE), 
               Math.floor((this.y + halfSize) / TILE_SIZE)) &&
    isWalkable(Math.floor((newX + halfSize) / TILE_SIZE), 
               Math.floor((this.y + halfSize) / TILE_SIZE));
  
  // Check if Y movement is valid (same pattern)
  const canMoveY = /* ... */;
  
  // Apply valid movement
  if (canMoveX) this.x = newX;
  if (canMoveY) this.y = newY;
}
```

### Why Check X and Y Separately?

This enables "sliding" along walls instead of getting stuck:

```
Combined check (frustrating):     Separate axis check (smooth):

Player moving ↘                   Player moving ↘
                                  
    ████                              ████
    ████                              ████
      ●→ BLOCKED!                       ●
      (stuck completely)                ↓ (slides down along wall)
```

---

## Common Enhancements

### 1. Diagonal Movement

Add diagonal neighbors and use Euclidean distance:

```javascript
const neighbors = [
  { dx: 0, dy: -1, cost: 1 },      // up
  { dx: 0, dy: 1, cost: 1 },       // down
  { dx: -1, dy: 0, cost: 1 },      // left
  { dx: 1, dy: 0, cost: 1 },       // right
  { dx: -1, dy: -1, cost: 1.414 }, // up-left (√2)
  { dx: 1, dy: -1, cost: 1.414 },  // up-right
  { dx: -1, dy: 1, cost: 1.414 },  // down-left
  { dx: 1, dy: 1, cost: 1.414 },   // down-right
];

// Also update heuristic to Euclidean
function heuristic(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### 2. Path Smoothing

Remove unnecessary waypoints using line-of-sight checks:

```javascript
function smoothPath(path) {
  if (path.length < 3) return path;
  
  const smoothed = [path[0]];
  let current = 0;
  
  while (current < path.length - 1) {
    // Find furthest visible waypoint
    let furthest = current + 1;
    
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
```

Before and after:
```
Original path:          Smoothed path:
●→→→↓                   ●
    ↓                    ╲
    ↓                     ╲
    ↓                      ╲
    →→→★                    ★
    
8 waypoints              2 waypoints (straight line)
```

### 3. Dynamic Obstacles (Other NPCs)

Recompute paths when obstacles move:

```javascript
class NPC {
  update(deltaTime) {
    // Check if path is still valid
    if (this.path && this.pathIsBlocked()) {
      this.recomputePath();
    }
    
    // Normal movement...
  }
  
  pathIsBlocked() {
    for (let i = this.pathIndex; i < this.path.length; i++) {
      const tile = this.path[i];
      if (isTileOccupiedByOtherNPC(tile.x, tile.y, this)) {
        return true;
      }
    }
    return false;
  }
}
```

### 4. Weighted Tiles

Some tiles might be walkable but slower (mud, stairs):

```javascript
function getMovementCost(tileX, tileY) {
  const tile = tilemap[tileY][tileX];
  switch (tile) {
    case FLOOR: return 1;
    case MUD: return 3;      // Slower
    case ROAD: return 0.5;   // Faster
    default: return Infinity; // Blocked
  }
}

// In A*, use actual cost instead of 1:
const tentativeG = gScore.get(current.key) + getMovementCost(nx, ny);
```

### 5. Hierarchical Pathfinding

For large maps, divide into regions and pathfind at two levels:

```
1. Find which rooms to traverse (high-level)
2. Find detailed path within each room (low-level)

Large office building:
┌─────────┬─────────┐
│ Room A  │ Room B  │     High-level: A → B → D
│    ●    ├────□────┤
│         │         │     Low-level: detailed paths
├────□────┤ Room C  │     within each room
│ Room D  │    ★    │
│         │         │
└─────────┴─────────┘

□ = doorways (connections between regions)
```

---

## Performance Considerations

| Concern | Solution |
|---------|----------|
| Large maps | Use hierarchical pathfinding or limit search radius |
| Many NPCs | Stagger pathfinding across frames, cache common routes |
| Frequent recalculation | Only recompute when destination or obstacles change |
| Memory usage | Use object pooling for path arrays |

### Frame Budget Example

```javascript
// Limit pathfinding to 2 NPCs per frame
let pathfindingQueue = [];
const MAX_PATHS_PER_FRAME = 2;

function update() {
  let computed = 0;
  
  while (pathfindingQueue.length > 0 && computed < MAX_PATHS_PER_FRAME) {
    const npc = pathfindingQueue.shift();
    npc.computePath();
    computed++;
  }
}
```

---

## Summary

1. **Tilemap** defines the world as a grid of walkable/blocked cells
2. **A*** finds the shortest path by exploring tiles with lowest estimated total cost
3. **Path following** moves entities smoothly between waypoints
4. **Collision detection** checks movement against the grid at pixel level
5. **Enhancements** like diagonal movement and path smoothing improve quality

The combination of tile-based pathfinding and pixel-based movement gives you the best of both worlds: efficient obstacle avoidance with smooth visual movement.
