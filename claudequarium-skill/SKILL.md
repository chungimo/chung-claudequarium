---
name: claudequarium
description: Spawns a character in the Claudequarium visualization that reflects Claude's activity during this session.
user-invocable: true
---

# Claudequarium Integration

This skill spawns an animated character in the Claudequarium visualization that reflects what Claude is doing during the session.

## What This Skill Does

When you run `/claudequarium`, Claude will:

1. **Spawn** a character in the visualization
2. **Update state** throughout the session based on activity:
   - THINKING - when reading, searching, exploring
   - CODING - when writing, editing, running commands
   - PLANNING - when using todos or plan mode
   - IDLE - when waiting for user input
3. **Wave** at the user when asked (character glows, smiles, and spins)
4. **Despawn** the character when the user ends the session or says goodbye

---

## Instructions for Claude

**IMPORTANT:** Do NOT modify settings.json or add hooks. This skill works by making direct API calls during the session.

### When This Skill Is Invoked

1. **Check if the server is running** by making a test request:
   ```bash
   curl -s http://localhost:4000/api/state
   ```
   If this fails, tell the user to start the server first (see "Starting the Server" below).

2. **Spawn an entity** for this session (show "Claudequarium: Spawning" message):
   ```bash
   echo "Claudequarium: Spawning" && curl -s -X POST http://localhost:4000/api/spawn -H "Content-Type: application/json" -d '{"session_id": "<SESSION_ID>"}'
   ```
   Use the current session ID or generate a unique identifier.

3. **Save the entity_id** from the response. You'll need it for state updates.

4. **Confirm to the user** that their character has spawned and tell them to open http://localhost:4000 in a browser to see it.

### During the Session

Update the entity state based on what you're doing. Use echo to show a brief status, then run curl silently:

```bash
echo "Claudequarium: <STATE>" && curl -s -X POST http://localhost:4000/api/state -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>", "state": "<STATE>"}' >/dev/null 2>&1
```

**IMPORTANT:** Always use this format with echo prefix and `>/dev/null 2>&1` to suppress curl output. Only the "Claudequarium: STATE" message should be visible.

**State mapping:**
| Activity | State |
|----------|-------|
| Reading files, searching, exploring codebase | THINKING |
| Writing, editing files, running bash commands | CODING |
| Using TodoWrite, planning, organizing | PLANNING |
| Waiting for user, asking questions | IDLE |

You don't need to update state on every single tool call - just when the activity type changes.

### When the User Asks to Wave

When the user says "wave", "say hi", or asks the character to wave:

```bash
echo "Claudequarium: Waving!" && curl -s -X POST http://localhost:4000/api/wave -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>"}' >/dev/null 2>&1
```

**What happens when you wave:**
- Character looks up at the viewer with happy eyes (^ ^) for 2 seconds
- Then spins around with a yellow glow for 3 seconds
- Then looks up at the viewer again for 2 seconds
- A wave emoji appears above throughout
- Total effect lasts ~7 seconds

### When the Session Ends

When the user says goodbye, ends the conversation, or explicitly asks to disconnect:

```bash
echo "Claudequarium: Despawning" && curl -s -X POST http://localhost:4000/api/despawn -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>"}' >/dev/null 2>&1
```

---

## Starting the Server

The Claudequarium server must be running before using this skill.

**Location:** The server is in the `claudequarium-server` directory relative to this skill, or may be at:
- `D:/chung/gitstuff/chung-claudequarium/claudequarium-server/`

**To start:**
```bash
cd <path-to-claudequarium-server>
npm start
```

**To view:** Open http://localhost:4000 in a browser.

---

## API Reference

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/spawn` | POST | `{"session_id": "..."}` | Spawns entity, returns `{"entity_id": "..."}` |
| `/api/state` | POST | `{"entity_id": "...", "state": "..."}` | Updates entity state |
| `/api/wave` | POST | `{"entity_id": "..."}` | Makes entity wave (look up, spin, look up - 7s) |
| `/api/despawn` | POST | `{"entity_id": "..."}` | Removes entity |

**Valid states:** `THINKING`, `CODING`, `PLANNING`, `IDLE`

---

## Configuration

Environment variable:
- `CLAUDEQUARIUM_SERVER`: Game server URL (default: `http://localhost:4000`)

---

## Files

```
claudequarium-skill/
├── SKILL.md                    # This file
└── hooks/                      # Shell scripts (for manual hook setup only)
    ├── session-start.sh
    ├── tool-use.sh
    ├── stop.sh
    └── session-end.sh
```

## Manual Hook Setup (Alternative)

If you want automatic state updates without invoking the skill each session, you can manually add hooks to your project's `.claude/settings.json`. See the shell scripts in the `hooks/` directory for the implementation.
