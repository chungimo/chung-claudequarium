# Claudequarium

A browser-based pixel art visualization where Claude Code agents appear as animated characters in a shared virtual office. When you run Claude Code, a character spawns and performs animations based on what the agent is doing.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- Real-time visualization of Claude Code activity
- Characters move between zones based on agent state (thinking, coding, planning, idle)
- Wave animation when you say "wave" to your agent
- WebSocket-based live updates across multiple browser clients
- Cross-platform support (Windows, macOS, Linux)

## Quick Start

### 1. Start the Server

```bash
cd claudequarium-server
npm install
npm start
```

The server runs on `http://localhost:4000` by default.

### 2. Open the Visualization

Open `http://localhost:4000` in your browser.

### 3. Connect Claude Code

Run `/claudequarium` in any Claude Code session to spawn a character.

Or add the skill to your global settings (`~/.claude/settings.json`):

```json
{
  "skills": [
    "/path/to/chung-claudequarium/claudequarium-skill"
  ]
}
```

## Configuration

Server settings are stored in `claudequarium-server/config.env`:

```env
HOST=0.0.0.0    # 0.0.0.0 for network access, 127.0.0.1 for localhost only
PORT=4000
```

Copy `config.env.example` to `config.env` to get started.

## Project Structure

```
chung-claudequarium/
├── claudequarium-server/
│   ├── src/                  # Server code (Express + WebSocket)
│   ├── public/
│   │   └── js/
│   │       ├── renderer/     # Modular rendering (background, entities, animations)
│   │       └── entities/     # Entity management (movement, state, wandering)
│   ├── map/                  # Tiled map source files
│   ├── config.env            # Server configuration
│   ├── start.sh              # Linux/macOS startup script
│   └── start.ps1             # Windows PowerShell startup script
└── claudequarium-skill/
    ├── SKILL.md              # Skill definition for Claude Code
    └── hooks/                # Shell hook scripts
```

## How It Works

1. Claude Code invokes the `/claudequarium` skill
2. The skill spawns an entity via HTTP POST to the server
3. As Claude works, state updates are sent to the server
4. Server broadcasts state changes to all connected browsers via WebSocket
5. Browser renders animated characters with pathfinding and state-based animations

## Entity States

| State | Trigger | Behavior |
|-------|---------|----------|
| THINKING | Read, Grep, Glob, WebSearch | Wanders in thinking zone |
| CODING | Write, Edit, Bash | Works at assigned desk |
| PLANNING | TodoWrite, EnterPlanMode | Stands at whiteboard |
| IDLE | Waiting for user input | Roams between idle zones |

## Commands

When connected via `/claudequarium`:

- Say "wave" to make your character wave at the viewer
- Say "goodbye" or end the session to despawn your character

## Scripts

**Linux/macOS:**
```bash
./start.sh    # Start server
./stop.sh     # Stop server
```

**Windows PowerShell:**
```powershell
./start.ps1   # Start server
./stop.ps1    # Stop server
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/spawn` | POST | Spawn a new entity |
| `/api/state` | POST | Update entity state |
| `/api/wave` | POST | Trigger wave animation |
| `/api/despawn` | POST | Remove an entity |
| `/api/entities` | GET | List all entities (debug) |
| `/health` | GET | Server health check |

## Debug Controls

Press these keys in the browser:

- `S` - Spawn test entity
- `W` - Wave (selected entity)
- `1-4` - Set state (Thinking/Planning/Coding/Idle)
- `C` - Toggle collision grid
- `Z` - Toggle zone boundaries
- `P` - Toggle pathfinding visualization
- `I` - Toggle entity info

## License

MIT
