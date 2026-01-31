# Claudequarium

A browser-based pixel art office visualization where Claude Code agent instances appear as animated characters. When developers run Claude Code in their terminals, a character spawns into a shared virtual office and performs contextual animations based on what the agent is doing (thinking, planning, coding, etc.).

## Project Structure

```
chung-claudequarium/
├── claudequarium-server/     # Game server (Express + WebSocket)
│   ├── src/                  # Server code
│   ├── public/               # Client code (HTML/CSS/JS)
│   ├── map/                  # Tiled map source files
│   └── guides/               # Documentation
├── claudequarium-skill/      # Claude Code skill
│   ├── SKILL.md              # Skill definition
│   └── hooks/                # Hook scripts
└── claudequarium-plan.md     # Project plan
```

## Quick Start

### 1. Start the Game Server

```bash
cd claudequarium-server
npm install
npm start
```

Server runs on http://localhost:4000

### 2. Open the Visualization

Open http://localhost:4000 in your browser.

### 3. Connect Claude Code

Run `/claudequarium` in any Claude Code session to configure the hooks.

Or manually add the skill to your global settings (`~/.claude/settings.json`):

```json
{
  "skills": [
    "D:/chung/gitstuff/chung-claudequarium/claudequarium-skill"
  ]
}
```

## How It Works

1. Claude Code sessions trigger hooks (SessionStart, PreToolUse, Stop, SessionEnd)
2. Hooks send HTTP POST requests to the game server
3. Server broadcasts entity state to all connected browsers via WebSocket
4. Browser renders animated characters based on state

## States

| State | Trigger | Animation |
|-------|---------|-----------|
| THINKING | Read, Grep, Glob, WebSearch | Pacing in open area |
| CODING | Write, Edit, Bash | Typing at desk |
| PLANNING | TodoWrite, EnterPlanMode | At whiteboard |
| IDLE | Stop (waiting for user) | Lounging |

## Documentation

- [Project Plan](claudequarium-plan.md)
- [NPC Movement Guide](claudequarium-server/guides/NPC_MOVEMENT_GUIDE.md)
- [TMX Implementation Guide](claudequarium-server/guides/TMX_IMPLEMENTATION_GUIDE.md)
- [TMX Pathfinding Guide](claudequarium-server/guides/TMX_PATHFINDING_GUIDE.md)
