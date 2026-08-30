#!/usr/bin/env bash
# Screenshot new HTML mockups → PNG
# Usage: bash scripts/screenshot_mockups.sh

set -euo pipefail

MOCKUP_DIR="$(dirname "$0")/../figma-mockups"
PNG_DIR="$MOCKUP_DIR/png"

mkdir -p "$PNG_DIR"

# Find HTML files without corresponding PNGs
count=0
for html in "$MOCKUP_DIR"/*.html; do
  [ -f "$html" ] || continue
  base="$(basename "$html" .html)"
  png="$PNG_DIR/${base}.png"

  if [ -f "$png" ]; then
    continue
  fi

  # Detect mobile viewport
  width=1440
  if grep -q 'width=390' "$html" 2>/dev/null; then
    width=390
  fi

  echo -n "📸 ${base}.png (${width}px)... "
  if npx playwright screenshot \
    --viewport-size="${width},900" \
    --full-page \
    --wait-for-timeout 500 \
    "file://$(realpath "$html")" \
    "$png" 2>/dev/null; then
    echo "✓"
    count=$((count + 1))
  else
    echo "✗"
  fi
done

echo ""
echo "Done. Generated $count new screenshots in $PNG_DIR"
