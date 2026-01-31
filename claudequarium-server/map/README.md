# Map System

This folder contains the Tiled map editor source files and parsing tools for the Claudequarium.

## Folder Structure

```
map/
├── office_space.tmx          # Source map (edit in Tiled)
├── office_space_data.json    # Parsed output (generated)
├── README.md                 # This file
└── map-data/                 # Parser tools
    ├── parse-map.js          # TMX to JSON parser
    └── visualize-map.js      # ASCII debug visualization
```

## File Overview

| File | Purpose |
|------|---------|
| `office_space.tmx` | Source map file (edit in [Tiled](https://www.mapeditor.org/)) |
| `office_space_data.json` | Parsed zone/collision data (generated) |
| `map-data/parse-map.js` | TMX to JSON parser |
| `map-data/visualize-map.js` | ASCII debug visualization |

---

## Updating the Map

### 1. Edit in Tiled

Open `office_space.tmx` in [Tiled Map Editor](https://www.mapeditor.org/).

**Key layers:**
- `ZONE-COLLISION` - Collision rectangles (invisible, blocks pathfinding)
- `ZONE-WORKING-*` - Workstation zones for CODING state
- `ZONE-PLANNING` - Whiteboard zones for PLANNING state
- `ZONE-THINKING` - Open floor zones for THINKING state
- `ZONE-IDLE` - Lounge/break zones for IDLE state

### 2. Export Background Image

After visual changes:
1. **File > Export As Image**
2. Save as `office_space-background.png`
3. Copy to game: `cp office_space-background.png ../public/assets/background.png`

### 3. Parse Map Data

After zone or collision changes:

```bash
cd map
node parse-map.js office_space.tmx > office_space_data.json
```

### 4. Deploy to Game

Copy the parsed data to the public folder:

```bash
cp office_space_data.json ../public/data/mapData.json
```

### 5. Refresh Browser

Hard refresh (Ctrl+Shift+R) to reload the updated map data.

---

## Quick Update Script

For convenience, run all steps at once:

```bash
# From the map folder
node parse-map.js office_space.tmx > office_space_data.json && \
cp office_space_data.json ../public/data/mapData.json && \
cp office_space-background.png ../public/assets/background.png
echo "Map updated! Refresh browser."
```

---

## Zone Naming Convention

Zone objects follow this pattern:
```
{type}-{availability}-{facing}-{id}
```

**Examples:**
- `chair-available-cube-facing-away1` - Cubicle workstation, sprite faces up
- `whiteboard-available-facingaway-2` - Planning zone, sprite faces up
- `idle-zone-3` - Idle area, any direction

**Facing directions:**
- `facing-away` / `facingaway` - Sprite faces UP (back to camera)
- `facing-toward` / `facingtoward` - Sprite faces DOWN (toward camera)
- No facing specified - Any direction (idle/thinking zones)

---

## Collision Zones

Two types of collision are merged at runtime:

1. **Tile properties** - Wall tiles in `Room_Builder_Office_48x48` tileset have `collision: true`
2. **Object rectangles** - Manual shapes in `ZONE-COLLISION` layer

### Adding Collision

1. Select `ZONE-COLLISION` layer in Tiled
2. Use Rectangle tool to draw collision area
3. Name it descriptively (e.g., `col-desk-left`, `collision-42`)
4. Re-run parser

### Removing Collision

1. Select the collision rectangle in Tiled
2. Delete it
3. Re-run parser

---

## Debugging

### Visualize Collision Grid (ASCII)

```bash
node visualize-map.js office_space_data.json
```

### In-Game Debug Overlays

Press these keys while the game is running:
- `C` - Show collision grid (red = blocked)
- `Z` - Show zone boundaries
- `P` - Show pathfinding paths
- `I` - Show entity info

---

## Parser Output Structure

The parser generates JSON with:

```javascript
{
  map: { width, height, tileWidth, tileHeight, pixelWidth, pixelHeight },
  workstations: [...],      // CODING zones
  planningZones: [...],     // PLANNING zones
  thinkingZones: [...],     // THINKING zones
  idleZones: [...],         // IDLE zones
  collisionRects: [...],    // Raw collision rectangles
  collisionGrid: [...],     // Tile-property based grid
  unifiedCollisionGrid: [...] // Merged grid (USE THIS)
}
```

Each zone has:
```javascript
{
  id: "zone-name",
  x, y,                    // Top-left corner (pixels)
  width, height,           // Size (pixels)
  centerX, centerY,        // Center point (pixels)
  facing: "away" | "toward" | null
}
```

---

## Troubleshooting

### Entities walking through walls
- Check `ZONE-COLLISION` layer for missing rectangles
- Run parser and redeploy
- Press `C` in-game to visualize collision

### Entities can't reach zones
- Zone center might be inside collision area
- Adjust zone position or collision boundaries
- Check parser output for zone centerX/centerY values

### Background not updating
- Make sure to export image from Tiled after visual changes
- Copy to `../public/assets/background.png`
- Hard refresh browser (Ctrl+Shift+R)

### Parser errors
- Ensure TMX file is valid XML
- Check that object layers use correct naming
- Verify tileset paths are relative and accessible
