#!/bin/sh
# Render the three link-preview images from assets/og-card.html.
# Run from the repo root with a local server on port 8123, or pass a base URL:
#   sh tools/build_og.sh [http://localhost:8123]
set -e
BASE="${1:-http://localhost:8123}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
for page in home evidence cv; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --virtual-time-budget=6000 --window-size=1200,630 \
    --screenshot="assets/og-$page.png" "$BASE/assets/og-card.html?page=$page" 2>/dev/null
  echo "assets/og-$page.png  $(wc -c < "assets/og-$page.png") bytes"
done
