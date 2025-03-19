#!/bin/bash

# Change to the directory where this script is located
cd "$(dirname "$0")"

# Display game logo
echo "
█████        ██    ██  ████    ████  ██████  ██    ██   ██████   ██████
██          ████  ████  ██ █  █ ██  ██    ██ ███   ██  ██    ██  ██   ██
██         ██  ████  ██ ██  ██  ██  ██    ██ ████  ██  ██    ██  ██████
██        ████████████ ██      ██  ██    ██ ██ ██ ██  ██    ██  ██   ██
███████  ██          ██ ██      ██   ██████  ██   ███   ██████   ██   ██
"

echo "🎮 Starting Luminor Game..."
echo "🌐 Launching development server..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js from https://nodejs.org/"
    echo "Press any key to exit..."
    read -n 1
    exit 1
fi

# Start Vite in the background
npx vite &
SERVER_PID=$!

# Wait a moment for the server to initialize
sleep 2

# Open the browser
echo "🌐 Opening game in browser..."
open http://localhost:5173

echo "✨ Game launched successfully!"
echo "💡 Game is running in your browser. This window can be minimized."
echo "💡 Close this window when you're done playing to stop the server."

# Wait for this script to be terminated
wait $SERVER_PID

# Clean up when the script is terminated
echo "🛑 Game server stopped."
exit 0 