#!/bin/sh
# Claudequarium Server Stop Script

PORT=4000

PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -n "$PID" ]; then
    echo "Stopping Claudequarium Server (PID: $PID)"
    kill $PID
    echo "Server stopped."
else
    echo "No server running on port $PORT"
fi
