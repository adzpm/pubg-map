#!/usr/bin/env bash
#
# Builds the link-preview images (web/public/og/<map>.jpg, 1200x630) from the map tiles.
# Usage: scripts/build-og.sh [map-id ...]   (default: every map under web/public/assets/tiles)
# Requires: vips

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TILES="$ROOT/web/public/assets/tiles"
OUT="$ROOT/web/public/og"
ZOOM=3   # 2048 px: enough for a 1200 px wide picture
SIDE=$((1 << ZOOM))

command -v vips >/dev/null || { echo "[ERROR] vips is not installed" >&2; exit 1; }

mkdir -p "$OUT"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

maps=("$@")
if [ ${#maps[@]} -eq 0 ]; then
    for dir in "$TILES"/*/; do maps+=("$(basename "$dir")"); done
fi

for id in "${maps[@]}"; do
    files=()
    for ((y = 0; y < SIDE; y++)); do
        for ((x = 0; x < SIDE; x++)); do
            tile="$TILES/$id/$ZOOM/$y/$x.webp"
            [ -f "$tile" ] || { echo "[ERROR] $id: missing tile $ZOOM/$y/$x.webp" >&2; exit 1; }
            files+=("$tile")
        done
    done
    vips arrayjoin "${files[*]}" "$tmp/$id.v" --across "$SIDE"
    # fill 1200x630 from the middle of the map
    vips thumbnail "$tmp/$id.v" "$OUT/$id.jpg[Q=82,strip,optimize_coding]" 1200 --height 630 --crop centre
    echo "[INFO] $id: $(du -h "$OUT/$id.jpg" | cut -f1 | tr -d ' ')"
done
