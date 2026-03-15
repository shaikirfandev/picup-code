#!/usr/bin/env bash
# ─────────────────────────────────────────────
# PicUp — Start Backend & Frontend
# ─────────────────────────────────────────────

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
  echo -e "\n${YELLOW}⏹  Shutting down...${NC}"
  [[ -n "$BACKEND_PID" ]] && kill "$BACKEND_PID" 2>/dev/null
  [[ -n "$FRONTEND_PID" ]] && kill "$FRONTEND_PID" 2>/dev/null
  wait 2>/dev/null
  echo -e "${GREEN}✔  All processes stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ── Check node_modules ───────────────────────
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo -e "${CYAN}📦 Installing backend dependencies...${NC}"
  (cd "$BACKEND_DIR" && npm install)
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo -e "${CYAN}📦 Installing frontend dependencies...${NC}"
  (cd "$FRONTEND_DIR" && npm install)
fi

# ── Start Backend ────────────────────────────
echo -e "${GREEN}🚀 Starting backend  (http://localhost:4500)${NC}"
(cd "$BACKEND_DIR" && npm run dev) &
BACKEND_PID=$!

# ── Start Frontend ───────────────────────────
echo -e "${GREEN}🚀 Starting frontend (http://localhost:3000)${NC}"
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Backend  → http://localhost:4500${NC}"
echo -e "${CYAN}  Frontend → http://localhost:3000${NC}"
echo -e "${CYAN}  Press Ctrl+C to stop both${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

wait
