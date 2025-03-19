#!/bin/bash

# Luminor Game Launcher
# This script starts the Vite development server and opens the game in your browser

echo "🎮 Starting Luminor..."
echo "🌐 Launching development server..."

# Start Vite in the background
npx vite &
SERVER_PID=$!

# Wait a moment for the server to initialize
sleep 2

# Open the browser
echo "🌐 Opening game in browser..."
open http://localhost:5173

echo "✨ Game launched successfully!"
echo "💡 Press Ctrl+C in this terminal when you're done playing to stop the server."

# Wait for user to press Ctrl+C
trap "kill $SERVER_PID; echo '🛑 Game server stopped.'; exit" INT
wait 