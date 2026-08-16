#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo "🌐 Launching CarInspect AI with Live Public HTTPS Tunnel"
echo "=========================================================="

# Start backend and frontend
"$DIR/start.sh" &
SERVICES_PID=$!

sleep 4

echo ""
echo "🚀 Opening Live Cloudflare HTTPS Tunnel for Mobile Access..."
/Users/florecer/cloudflared tunnel --url http://localhost:3000

cleanup() {
  kill $SERVICES_PID 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM
