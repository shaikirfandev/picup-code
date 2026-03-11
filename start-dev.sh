#!/bin/bash

# Start both frontend and backend dev servers concurrently
# Usage: ./start-dev.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
  exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Starting Backend (nodemon)...${NC}"
cd "$ROOT_DIR/backend" && npm run dev 2>&1 | sed "s/^/[backend]  /" &
BACKEND_PID=$!

echo -e "${GREEN}Starting Frontend (next dev)...${NC}"
cd "$ROOT_DIR/frontend" && npm run dev 2>&1 | sed "s/^/[frontend] /" &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backend  → http://localhost:5000${NC}"
echo -e "${GREEN}  Frontend → http://localhost:3000${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop both${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

wait $BACKEND_PID $FRONTEND_PID
