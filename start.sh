#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "🚗 Starting AI Car Pre-Purchase Inspection & Diagnostic App"
echo "=========================================================="

# Kill any previous instances on ports 8000 and 3000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "1. Starting FastAPI Python Backend on http://localhost:8000 ..."
cd "$DIR/backend"
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "2. Starting Next.js PWA Frontend on http://localhost:3000 ..."
cd "$DIR/frontend"
npm run dev -- -p 3000 &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "Shutting down CarInspect AI services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "✅ Both services running!"
echo "👉 Frontend (PWA Web App): http://localhost:3000"
echo "👉 Backend (FastAPI Swagger Docs): http://localhost:8000/docs"
echo "Press Ctrl+C to stop all servers."

wait
