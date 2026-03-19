#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install backend dependencies if needed
if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
  echo "Installing backend dependencies..."
  cd "$ROOT_DIR/backend" && npm install
else
  echo "Backend node_modules already installed, skipping."
fi

# Install frontend dependencies if needed
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd "$ROOT_DIR/frontend" && npm install
else
  echo "Frontend node_modules already installed, skipping."
fi

echo ""
echo "Starting the app..."

# Run backend in background
cd "$ROOT_DIR/backend" && npm run dev &
BACKEND_PID=$!

# Run frontend
cd "$ROOT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo "Backend running (PID: $BACKEND_PID)"
echo "Frontend running (PID: $FRONTEND_PID)"

# Handle Ctrl+C to stop both processes
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both
wait
