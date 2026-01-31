#!/bin/bash
# Claudequarium Server Startup Script
# Configuration is loaded from config.env file

cd "$(dirname "$0")"

echo "Starting Claudequarium Server..."
echo "Configuration loaded from config.env"
npm start
