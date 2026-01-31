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

1. **Read the server URL from config.env** in the skill folder:
   ```bash
   cat "<SKILL_FOLDER>/config.env"
   ```
   Extract the `CLAUDEQUARIUM_SERVER` value. If the file doesn't exist or the variable is missing, default to `http://localhost:4000`.

   **Save this URL** - you'll use it for all API calls in this session (referred to as `<SERVER_URL>` below).

2. **Check if the server is running** by making a test request:
   ```bash
   curl -s --max-time 5 <SERVER_URL>/health
   ```
   If this fails or returns empty, tell the user to start the server first (see "Starting the Server" below).

3. **Spawn an entity** for this session (show "Claudequarium: Spawning" message):
   ```bash
   echo "Claudequarium: Spawning" && curl -s --max-time 5 -X POST <SERVER_URL>/api/spawn -H "Content-Type: application/json" -d '{"session_id": "<SESSION_ID>"}'
   ```
   Use the current session ID or generate a unique identifier.

4. **Save the entity_id** from the response. You'll need it for state updates.

5. **Confirm to the user** that their character has spawned and tell them to open the server URL in a browser to see it.

### During the Session

Update the entity state based on what you're doing. Use echo to show a brief status, then run curl with a timeout:

```bash
echo "Claudequarium: <STATE>" && curl -s --max-time 5 -X POST <SERVER_URL>/api/state -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>", "state": "<STATE>"}'
```

**IMPORTANT:** Check the curl response. If it returns empty or fails, follow the Error Handling section below.

**State mapping:**
| Activity | State |
|----------|-------|
| Reading files, searching, exploring codebase | THINKING |
| Writing, editing files, running bash commands | CODING |
| Using TodoWrite, planning, organizing | PLANNING |
| Waiting for user, asking questions | IDLE |

You don't need to update state on every single tool call - just when the activity type changes.

### Error Handling

If any API call to the server fails (timeout, connection refused, no response), you must:

1. **Stop sending further Claudequarium updates** - do not attempt more API calls
2. **Inform the user** with this message:
   ```
   Claudequarium: Server failed to respond. Ending visualization session.
   Entity ID: <ENTITY_ID>
   ```
3. **End the skill** - stop tracking state and treating this as an active Claudequarium session

To detect failures, use curl with a timeout:
```bash
curl -s --max-time 5 -X POST <SERVER_URL>/api/state -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>", "state": "<STATE>"}'
```

If the command returns empty or curl exits with a non-zero status, the server is unreachable.

**Note:** The entity will remain visible in the browser until the server restarts (which clears all entities) or until the server's idle timeout removes it. This is expected behavior.

### When the User Asks to Wave

When the user says "wave", "say hi", or asks the character to wave:

```bash
echo "Claudequarium: Waving!" && curl -s --max-time 5 -X POST <SERVER_URL>/api/wave -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>"}'
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
echo "Claudequarium: Despawning" && curl -s --max-time 5 -X POST <SERVER_URL>/api/despawn -H "Content-Type: application/json" -d '{"entity_id": "<ENTITY_ID>"}'
```

---

## Starting the Server

The Claudequarium server must be running before using this skill.

**Location:** The server is in the `claudequarium-server` directory (sibling folder to `claudequarium-skill`).

**To start:**
```bash
cd <path-to-claudequarium-server>
npm start
```

**To view:** Open the server URL in a browser (default: http://localhost:4000).

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

Copy `config.env.example` to `config.env` and edit the server URL:

```env
CLAUDEQUARIUM_SERVER=http://localhost:4000
```

Change this to your server's address if running on a different host or port.

---

## Files

```
claudequarium-skill/
├── SKILL.md                    # This file
├── config.env                  # Server URL configuration (create from .example)
├── config.env.example          # Example configuration
└── hooks/                      # Shell scripts (for manual hook setup only)
    ├── session-start.sh
    ├── tool-use.sh
    ├── stop.sh
    └── session-end.sh
```

## Manual Hook Setup (Alternative)

If you want automatic state updates without invoking the skill each session, you can manually add hooks to your project's `.claude/settings.json`. See the shell scripts in the `hooks/` directory for the implementation.
