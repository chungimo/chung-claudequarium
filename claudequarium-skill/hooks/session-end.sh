#!/bin/sh
# Claudequarium - Session End Hook
# Despawns the entity when a Claude Code session ends

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

# Read entity_id
if command -v jq >/dev/null 2>&1; then
  ENTITY_ID=$(jq -r '.entity_id // empty' < "$ENTITY_FILE")
else
  ENTITY_ID=$(grep -o '"entity_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$ENTITY_FILE" | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Despawn entity
curl -s -X POST "$SERVER_URL/api/despawn" \
  -H "Content-Type: application/json" \
  -d "{\"entity_id\": \"$ENTITY_ID\"}" >/dev/null

# Clean up local file
rm -f "$ENTITY_FILE"

echo "Claudequarium: Despawned entity $ENTITY_ID" >&2
exit 0
