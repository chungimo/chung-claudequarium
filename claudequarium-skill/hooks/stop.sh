#!/bin/sh
# Claudequarium - Stop Hook
# Sets entity to IDLE when Claude finishes responding

SERVER_URL="${CLAUDEQUARIUM_SERVER:-http://localhost:4000}"
ENTITY_DIR="${TEMP:-/tmp}/claudequarium-entities"

# Read JSON from stdin
INPUT=$(cat)

# Parse session_id
if command -v jq >/dev/null 2>&1; then
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
else
  SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if no session_id
[ -z "$SESSION_ID" ] && exit 0

# Check if entity file exists
ENTITY_FILE="$ENTITY_DIR/$SESSION_ID.json"
[ ! -f "$ENTITY_FILE" ] && exit 0

# Read entity data
if command -v jq >/dev/null 2>&1; then
  ENTITY_ID=$(jq -r '.entity_id // empty' < "$ENTITY_FILE")
  LAST_STATE=$(jq -r '.last_state // empty' < "$ENTITY_FILE")
else
  ENTITY_ID=$(grep -o '"entity_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$ENTITY_FILE" | sed 's/.*:.*"\([^"]*\)".*/\1/')
  LAST_STATE=$(grep -o '"last_state"[[:space:]]*:[[:space:]]*"[^"]*"' "$ENTITY_FILE" | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if already IDLE
[ "$LAST_STATE" = "IDLE" ] && exit 0

# Set to IDLE
curl -s -X POST "$SERVER_URL/api/state" \
  -H "Content-Type: application/json" \
  -d "{\"entity_id\": \"$ENTITY_ID\", \"state\": \"IDLE\"}" >/dev/null

# Update entity file
cat > "$ENTITY_FILE" << EOF
{"entity_id":"$ENTITY_ID","session_id":"$SESSION_ID","last_state":"IDLE"}
EOF

exit 0
