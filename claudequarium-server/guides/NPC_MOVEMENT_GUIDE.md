# NPC Movement & Actions Guide

This guide covers the NPC (entity) movement system, state management, pathfinding integration, and behavioral patterns in Claudequarium.

---

## Table of Contents

1. [Entity States](#entity-states)
2. [Entity Creation & Properties](#entity-creation--properties)
3. [State Queue Management](#state-queue-management)
4. [Movement System](#movement-system)
5. [Zone Targeting](#zone-targeting)
6. [Wandering Behavior](#wandering-behavior)
7. [Speed & Timing Configuration](#speed--timing-configuration)
8. [Direction & Facing](#direction--facing)

---

## Entity States

NPCs can be in one of five states, each with distinct behaviors and zone requirements:

| State | Zone Type | Behavior |
|-------|-----------|----------|
| `SPAWNED` | Entry point | Initial state when entity first appears |
| `THINKING` | thinkingZones | Wanders within assigned zone at full speed |
| `PLANNING` | planningZones | Stands at whiteboard areas |
| `CODING` | workstations | Assigned to a specific workstation (persistent) |
| `IDLE` | idleZones | Roams freely between ALL idle zones at variable speed |

### State-to-Zone Mapping

```javascript
// config.js
export const STATE_TO_ZONE_TYPE = {
  CODING: 'workstations',
  PLANNING: 'planningZones',
  THINKING: 'thinkingZones',
  IDLE: 'idleZones'
};
```

---

## Entity Creation & Properties

When an entity is created, it receives the following properties:

```javascript
// entities.js - createEntity()
{
  // Identity
  id: data.entity_id,
  appearance: data.appearance || {},

  // State
  state: 'SPAWNED',           // Server-assigned state
  visualState: 'SPAWNED',     // Currently displayed state
  targetState: null,          // State being transitioned to

  // Position (spawns at entry point)
  x: spawnPoint.x,
  y: spawnPoint.y,

  // Pathfinding
  path: [],                   // Array of waypoints
  pathIndex: 0,               // Current waypoint index
  targetZone: null,           // Destination zone object

  // Movement
  isMoving: false,
  direction: 'down',          // 'up', 'down', 'left', 'right'
  currentSpeed: MOVE_SPEED,   // Can vary for idle wandering

  // Wandering (THINKING/IDLE states)
  wanderZone: null,           // Zone entity is wandering in
  nextWanderTime: 0,          // Timestamp for next wander

  // Timing
  currentStateStartTime: Date.now(),
  stateQueue: []              // Queued state changes
}
```

---

## State Queue Management

State changes are queued to ensure smooth transitions and minimum display times.

### Queueing a State Change

```javascript
queueStateChange(entity, 'CODING');
// Adds { state: 'CODING', queuedAt: Date.now() } to stateQueue
```

### Processing the Queue

The queue is processed each frame in `processStateQueue()`:

1. **Movement Check**: Won't process if entity is currently moving
2. **Minimum Display Time**: Ensures current state shows for at least `MIN_STATE_DISPLAY_MS` (4 seconds)
3. **Collapse Redundant**: Removes consecutive duplicate states
4. **Skip Current**: Ignores if already in the target state

```
State Queue Flow:
┌─────────────────┐
│  Queue State    │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Is Moving?     │──Yes──► Wait
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Min Time Passed?│──No───► Wait
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐
│ Get Target Zone │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Calculate Path  │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Begin Movement  │
└─────────────────┘
```

### Workstation Assignment

When transitioning to `CODING`:
- Entity gets assigned a workstation (or uses existing assignment)
- Assignment persists until entity leaves `CODING` state
- Released via `releaseWorkstation()` when leaving

---

## Movement System

### Path Following

Entities follow A* calculated paths through waypoints:

```javascript
// updatePathFollowing() - Called each frame
1. Check if reached end of path → arriveAtDestination()
2. Calculate distance to current waypoint
3. If within PATH_ARRIVAL_THRESHOLD (4px) → advance to next waypoint
4. Otherwise, move toward waypoint at currentSpeed
5. Update direction based on movement vector
```

### Arrival Handling

When an entity reaches its destination:

```javascript
// arriveAtDestination()
1. Snap to exact zone center (not tile center)
   - entity.x = targetZone.centerX
   - entity.y = targetZone.centerY

2. Update state
   - isMoving = false
   - visualState = targetState

3. Set facing direction from zone data

4. Initialize wandering if THINKING/IDLE
   - Store wanderZone
   - Schedule nextWanderTime

5. Clear path data
```

### Path Endpoint Precision

The A* pathfinder returns tile-center waypoints (48px grid), but target positions can be at any pixel coordinate. To ensure smooth arrivals without snapping:

1. **Path is calculated** using A* (returns tile centers)
2. **Path is smoothed** to remove unnecessary waypoints
3. **Exact target is appended** as the final waypoint

```javascript
// After smoothing, add exact destination
entity.path = smoothPath(path);
entity.path.push({ x: targetZone.centerX, y: targetZone.centerY });
```

This ensures entities walk smoothly all the way to their destination rather than snapping from the last tile center.

```
Example:
Zone Center: (215.5, 296.16)
Last Tile Center: (216, 312)     ← Would snap 16px!

With endpoint fix:
  Path: [...tile centers..., (215.5, 296.16)]
  Entity walks smoothly to exact position
```

---

## Zone Targeting

### Getting Target Zone by State

```javascript
function getTargetZone(entity, state) {
  // CODING: Use assigned workstation
  if (state === 'CODING') {
    return getEntityWorkstation(entity.id) || assignWorkstation(entity.id);
  }

  // Get zones for this state type
  const zones = getZonesForState(state);

  // THINKING/IDLE: Pick random point within zone
  if (state === 'THINKING' || state === 'IDLE') {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const randomPoint = getRandomPointInZone(zone);
    return {
      ...zone,
      centerX: randomPoint.x,
      centerY: randomPoint.y
    };
  }

  // PLANNING: Pick random planning zone
  return zones[Math.floor(Math.random() * zones.length)];
}
```

---

## Wandering Behavior

Wandering occurs when entities are in `THINKING` or `IDLE` states and not moving.

### Timing

```javascript
// config.js
WANDER_MIN_DELAY_MS = 3000  // 3 seconds minimum
WANDER_MAX_DELAY_MS = 6000  // 6 seconds maximum

// Random delay between wanders
const delay = WANDER_MIN_DELAY_MS + Math.random() * (WANDER_MAX_DELAY_MS - WANDER_MIN_DELAY_MS);
entity.nextWanderTime = Date.now() + delay;
```

### THINKING vs IDLE Wandering

| Aspect | THINKING | IDLE |
|--------|----------|------|
| Zone Range | Confined to current zone | Can roam to ANY idle zone |
| Speed | Full speed (150 px/s) | Variable (40%-80% of normal) |
| Behavior | Pacing, focused | Leisurely, meandering |

### Wandering Logic

```javascript
function updateWandering(entity) {
  // Only in THINKING or IDLE states
  if (entity.visualState !== 'THINKING' && entity.visualState !== 'IDLE') {
    entity.wanderZone = null;
    entity.currentSpeed = MOVE_SPEED;
    return;
  }

  // Check timing
  if (Date.now() < entity.nextWanderTime) return;

  let zone;
  if (entity.visualState === 'IDLE') {
    // IDLE: Pick ANY idle zone randomly
    zone = zones[Math.floor(Math.random() * zones.length)];
    // Random leisurely speed (40% to 80%) for meandering style
    entity.currentSpeed = MOVE_SPEED * (0.4 + Math.random() * 0.4);
  } else {
    // THINKING: Stay in current zone
    zone = entity.wanderZone || findCurrentZone(entity);
    entity.currentSpeed = MOVE_SPEED;  // Full speed
  }

  // Pick random point in target zone and pathfind
  const targetPoint = getRandomPointInZone(zone);
  const path = findPath(entity.x, entity.y, targetPoint.x, targetPoint.y);

  if (path && path.length > 1) {
    entity.path = smoothPath(path);
    // Add exact target as final waypoint for smooth arrival
    entity.path.push({ x: targetPoint.x, y: targetPoint.y });
    entity.isMoving = true;
  }

  // Schedule next wander
  entity.nextWanderTime = Date.now() + randomDelay();
}
```

### Visual Representation

```
THINKING State:
┌─────────────────────┐
│   THINKING ZONE     │
│                     │
│    ○ → ○ → ○        │  Entity paces within
│    ↑       ↓        │  single zone at full speed
│    ○ ← ○ ← ○        │
│                     │
└─────────────────────┘

IDLE State:
┌──────────┐         ┌──────────┐
│ IDLE #1  │         │ IDLE #2  │
│          │         │          │
│    ○ ──────────────────→ ○    │  Entity roams between
│          │         │    ↓     │  ALL idle zones at
└──────────┘         │    ○     │  leisurely pace
                     └──────────┘
```

---

## Speed & Timing Configuration

### Movement Constants

```javascript
// config.js
MOVE_SPEED = 150              // Base speed: 150 pixels/second
PATH_ARRIVAL_THRESHOLD = 4    // Within 4px = reached waypoint
MIN_STATE_DISPLAY_MS = 4000   // Stay in state at least 4 seconds
```

### Variable Speed (IDLE)

```javascript
// Range: 60 to 120 px/s for idle wandering (40%-80% of normal)
entity.currentSpeed = MOVE_SPEED * (0.4 + Math.random() * 0.4);

// Examples:
// 150 * 0.4 = 60 px/s  (minimum, slow meander)
// 150 * 0.6 = 90 px/s  (moderate stroll)
// 150 * 0.8 = 120 px/s (maximum, casual walk)
```

This slower range creates a noticeably leisurely, meandering style compared to full-speed movement.

### Speed is Reset When:

1. Entering a non-wandering state (CODING, PLANNING)
2. Processing state queue for transition
3. Exiting THINKING/IDLE states

---

## Direction & Facing

### Movement Direction

Direction is calculated based on movement vector:

```javascript
// pathfinding.js
export function getDirection(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'down' : 'up';
  }
}
```

### Zone Facing

Zones can specify a `facing` property from the TMX map:

| Map Value | Direction | Use Case |
|-----------|-----------|----------|
| `facing-away` | `'up'` | Workstations facing wall |
| `facing-toward` | `'down'` | Workstations facing camera |
| `null` | Keep current | Default behavior |

```javascript
// When arriving at destination
if (entity.targetZone && entity.targetZone.facing) {
  const direction = facingToDirection(entity.targetZone.facing);
  if (direction) {
    entity.direction = direction;
  }
}
```

---

## Update Loop Integration

The main update flow for entities:

```javascript
// Called each frame with deltaTime in seconds
export function updateEntity(entity, deltaTime) {
  // 1. Process pending state changes
  processStateQueue(entity);

  // 2. Follow path if moving
  if (entity.isMoving && entity.path.length > 0) {
    updatePathFollowing(entity, deltaTime);
  }

  // 3. Handle wandering when idle
  if (!entity.isMoving && entity.stateQueue.length === 0) {
    updateWandering(entity);
  }

  // 4. Update animation
  entity.animationTimer += deltaTime;
  if (entity.animationTimer > 0.3) {
    entity.animationTimer = 0;
    entity.animationFrame = (entity.animationFrame + 1) % 4;
  }
}
```

---

## Performance Notes

### Client-Side Wandering

Wandering is entirely client-side, requiring no server communication:
- ~4-7 path calculations per second with 20 entities
- A* is efficient on 25x20 tile grid
- Path smoothing reduces waypoint count

### Optimization Tips

1. **Path caching**: Frequently used routes could be cached
2. **Batch updates**: Entity updates are already batched per frame
3. **Zone lookups**: Zone arrays are small, linear search is fine

---

## Related Files

| File | Purpose |
|------|---------|
| [entities.js](../public/js/entities.js) | Entity creation, state management, movement |
| [pathfinding.js](../public/js/pathfinding.js) | A* algorithm, path smoothing |
| [config.js](../public/js/config.js) | Speed, timing, and state constants |
| [mapData.js](../public/js/mapData.js) | Zone data, collision grid |
| [state.js](../public/js/state.js) | Workstation assignments |

---

## See Also

- [TMX Pathfinding Guide](./TMX_PATHFINDING_GUIDE.md) - A* implementation details
- [TMX Implementation Guide](./TMX_IMPLEMENTATION_GUIDE.md) - Map parsing and zone extraction
