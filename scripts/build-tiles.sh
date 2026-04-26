#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v vips >/dev/null 2>&1; then
    echo "Error: vips not found. Install with: brew install vips"
    exit 1
fi

mkdir -p assets/tiles

shopt -s nullglob
for src in assets/maps/*.png; do
    base=$(basename "$src" .png)
    id=$(echo "$base" | sed 's/_Main_High_Res//' | tr '[:upper:]' '[:lower:]')
    out="assets/tiles/$id"

    if [ -d "$out" ]; then
        echo "skip $id (already tiled, delete $out to regenerate)"
        continue
    fi

    echo "tiling $id ..."
    vips dzsave "$src" "$out" \
        --layout google \
        --tile-size 256 \
        --suffix=".webp[Q=92]"

    w=$(vipsheader -f width "$src")
    h=$(vipsheader -f height "$src")
    printf '{"width":%d,"height":%d}\n' "$w" "$h" > "$out/info.json"

    echo "  ${w}x${h} -> $out"
done

echo "done"
