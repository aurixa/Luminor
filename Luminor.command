#!/bin/bash

# Exit on error, undefined vars, and pipe failures
set -euo pipefail

# Constants
readonly PORT=5173
readonly DEPENDENCIES=("node" "npm")

# Function to display the game logo
show_logo() {
    echo "
██      ██    ██ ██     ██ ██ ██    ██  ██████  ██████  
██      ██    ██ ███   ███ ██ ███   ██ ██    ██ ██   ██ 
██      ██    ██ ████ ████ ██ ████  ██ ██    ██ ██████  
██      ██    ██ ██ ███ ██ ██ ██ ██ ██ ██    ██ ██   ██ 
███████  ██████  ██     ██ ██ ██  ████  ██████  ██   ██ 
"
}

# Function to check dependencies
check_dependencies() {
    local missing=()
    for dep in "${DEPENDENCIES[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo "❌ Error: Missing required dependencies: ${missing[*]}"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
}

# Function to clean up existing server
cleanup_server() {
    if command -v lsof &> /dev/null; then
        local existing_pid
        existing_pid=$(lsof -i ":$PORT" -t 2>/dev/null || true)
        if [ -n "$existing_pid" ]; then
            echo "🧹 Cleaning up existing server..."
            kill -9 "$existing_pid" 2>/dev/null || true
            sleep 1  # Give the port time to be released
        fi
    fi
}

# Function to start the game
start_game() {
    echo "🌐 Launching game..."
    if ! npx vite --open; then
        echo "❌ Failed to start the game server"
        exit 1
    fi
}

main() {
    # Change to the script's directory
    cd "$(dirname "$0")"
    
    # Show welcome message and logo
    clear
    show_logo
    echo "🎮 Starting Luminor Game..."
    
    # Run checks and start game
    check_dependencies
    cleanup_server
    start_game
    
    echo "✨ Thanks for playing Luminor!"
}

# Run the script
main 