#!/bin/sh
# Claudequarium - Session Start Hook
# Spawns an entity when a Claude Code session starts

SERVER_URL="${CLAUDEQUARIUM_SERVER:-http://localhost:4000}"
ENTITY_DIR="${TEMP:-/tmp}/claudequarium-entities"

# Read JSON from stdin
INPUT=$(cat)

# Parse session_id using jq (or grep fallback)
if command -v jq >/dev/null 2>&1; then
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
else
  SESSION_ID=$(echo "$INPUT" | grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if no session_id
[ -z "$SESSION_ID" ] && exit 0

# Ensure entity directory exists
mkdir -p "$ENTITY_DIR"

# Check if entity already exists for this session
ENTITY_FILE="$ENTITY_DIR/$SESSION_ID.json"
[ -f "$ENTITY_FILE" ] && exit 0

# Spawn entity
RESPONSE=$(curl -s -X POST "$SERVER_URL/api/spawn" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\"}")

# Parse entity_id from response
if command -v jq >/dev/null 2>&1; then
  ENTITY_ID=$(echo "$RESPONSE" | jq -r '.entity_id // empty')
else
  ENTITY_ID=$(echo "$RESPONSE" | grep -o '"entity_id"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*:.*"\([^"]*\)".*/\1/')
fi

# Exit if spawn failed
[ -z "$ENTITY_ID" ] && exit 0

# Save entity info for other hooks
cat > "$ENTITY_FILE" << EOF
{"entity_id":"$ENTITY_ID","session_id":"$SESSION_ID","last_state":"SPAWNED"}
EOF

echo "Claudequarium: Spawned entity $ENTITY_ID" >&2
exit 0
