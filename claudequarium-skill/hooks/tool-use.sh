#!/bin/sh
# Claudequarium - Tool Use Hook (PreToolUse)
# Maps tool usage to game states

SERVER_URL="${CLAUDEQUARIUM_SERVER:-http://localhost:4000}"
ENTITY_DIR="${TEMP:-/tmp}/claudequarium-entities"

# Read JSON from stdin
INPUT=$(cat)

# Parse session_id and tool_name
if command -v jq >/dev/null 2>&1; then
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
else
  SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)".*/\1/')
  TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if missing required fields
[ -z "$SESSION_ID" ] || [ -z "$TOOL_NAME" ] && exit 0

# Check if entity file exists
ENTITY_FILE="$ENTITY_DIR/$SESSION_ID.json"
[ ! -f "$ENTITY_FILE" ] && exit 0

# Map tool to state
case "$TOOL_NAME" in
  Read|Grep|Glob|WebFetch|WebSearch|Task)
    NEW_STATE="THINKING"
    ;;
  Write|Edit|NotebookEdit|Bash)
    NEW_STATE="CODING"
    ;;
  TodoWrite|EnterPlanMode|ExitPlanMode)
    NEW_STATE="PLANNING"
    ;;
  AskUserQuestion)
    NEW_STATE="IDLE"
    ;;
  *)
    exit 0
    ;;
esac

# Read entity data
if command -v jq >/dev/null 2>&1; then
  ENTITY_ID=$(jq -r '.entity_id // empty' < "$ENTITY_FILE")
  LAST_STATE=$(jq -r '.last_state // empty' < "$ENTITY_FILE")
else
  ENTITY_ID=$(grep -o '"entity_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$ENTITY_FILE" | sed 's/.*:.*"\([^"]*\)".*/\1/')
  LAST_STATE=$(grep -o '"last_state"[[:space:]]*:[[:space:]]*"[^"]*"' "$ENTITY_FILE" | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if state unchanged
[ "$LAST_STATE" = "$NEW_STATE" ] && exit 0

# Send state change
curl -s -X POST "$SERVER_URL/api/state" \
  -H "Content-Type: application/json" \
  -d "{\"entity_id\": \"$ENTITY_ID\", \"state\": \"$NEW_STATE\"}" >/dev/null

# Update entity file with new state
cat > "$ENTITY_FILE" << EOF
{"entity_id":"$ENTITY_ID","session_id":"$SESSION_ID","last_state":"$NEW_STATE"}
EOF

exit 0
