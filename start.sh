#!/bin/bash
# 🎿 Majora Alpine - Startscript

cd "$(dirname "$0")"

# Döda eventuell gammal process
pkill -f "node.*majora-alpine/server.js" 2>/dev/null

# Starta servern
echo "🎿 Startar Majora Alpine..."
nohup node server.js > server.log 2>&1 &
PID=$!

sleep 1

if kill -0 $PID 2>/dev/null; then
  echo "✅ Server igång på http://localhost:3847"
  echo "   PID: $PID"
  echo ""
  echo "📱 Från mobilen: http://$(ipconfig getifaddr en0 2>/dev/null || echo '<din-ip>'):3847"
else
  echo "❌ Kunde inte starta servern"
  cat server.log
  exit 1
fi
