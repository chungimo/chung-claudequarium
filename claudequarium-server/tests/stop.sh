#!/bin/bash
# Claudequarium Server Stop Script
# Works on Linux and macOS

cd "$(dirname "$0")"

# Read port from config.env if it exists, otherwise default to 4000
if [ -f config.env ]; then
    PORT=$(grep -E "^PORT=" config.env | cut -d'=' -f2 | tr -d ' ')
fi
PORT=${PORT:-4000}

# Find process using the port (works on both Linux and macOS)
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:$PORT 2>/dev/null)
elif command -v fuser &> /dev/null; then
    PID=$(fuser $PORT/tcp 2>/dev/null)
else
    echo "Error: Neither lsof nor fuser found. Cannot detect running server."
    exit 1
fi

if [ -n "$PID" ]; then
    echo "Stopping Claudequarium Server (PID: $PID) on port $PORT"
    kill $PID
    echo "Server stopped."
else
    echo "No server running on port $PORT"
fi
