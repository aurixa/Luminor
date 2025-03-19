#!/bin/bash

# Change to the directory where this script is located
cd "$(dirname "$0")"

# Display game logo
echo "
██      ██    ██ ██     ██ ██ ██    ██  ██████  ██████  
██      ██    ██ ███   ███ ██ ███   ██ ██    ██ ██   ██ 
██      ██    ██ ████ ████ ██ ████  ██ ██    ██ ██████  
██      ██    ██ ██ ███ ██ ██ ██ ██ ██ ██    ██ ██   ██ 
███████  ██████  ██     ██ ██ ██  ████  ██████  ██   ██ 
"

echo "🎮 Starting Luminor Game..."

# Kill any existing Vite processes
if command -v lsof &> /dev/null; then
    EXISTING_PID=$(lsof -i :5173 -t 2>/dev/null)
    if [ -n "$EXISTING_PID" ]; then
        echo "🧹 Cleaning up existing server..."
        kill -9 $EXISTING_PID 2>/dev/null
    fi
fi

# Start Vite and open browser immediately
echo "🌐 Launching game..."
npx vite --open

# The script will naturally exit when Vite exits
echo "✨ Thanks for playing Luminor!" 