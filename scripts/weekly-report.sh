#!/bin/bash
# Invoked by cron every Sunday 6 PM. Runs the Node script that generates the
# weekly training report HTML and saves to weekly-report/ + ~/Desktop/.

set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=== Weekly report run: $(date '+%Y-%m-%d %H:%M:%S') ==="
node "$SCRIPT_DIR/weekly-report.mjs"
