#!/usr/bin/env bash
# Lance le jeu de Belote en local sur http://localhost:8000
# Usage : ./serve.sh [port]
set -e
PORT="${1:-8000}"
DIR="$(cd "$(dirname "$0")/site" && pwd)"
URL="http://localhost:${PORT}/"

echo "Jeu de Belote → ${URL}"
echo "(Ctrl+C pour arrêter)"

# Ouvre le navigateur si possible (macOS / Linux), sans bloquer
( sleep 1
  if command -v open      >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi ) >/dev/null 2>&1 &

cd "$DIR"
exec python3 -m http.server "$PORT"
