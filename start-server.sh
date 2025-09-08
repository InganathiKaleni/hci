#!/bin/bash

echo "========================================"
echo "    EdUTEND System Server Startup"
echo "========================================"
echo ""
echo "Starting the server on port 5501..."
echo ""
echo "If you see any errors, make sure you have:"
echo "1. Node.js installed (version 14 or higher)"
echo "2. Run 'npm install' to install dependencies"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
npm start
