#!/bin/bash
# Claudequarium Server Startup Script
# Configuration is loaded from config.env file

# Navigate to server root (parent of tests folder)
cd "$(dirname "$0")/.."

echo "Starting Claudequarium Server..."
echo "Configuration loaded from config.env"
npm start
