#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p web/public/assets/tiles

shopt -s nullglob

for src in assets/maps/*.png; do
    base=$(basename "$src" .png)
    id=$(echo "$base" | tr '[:upper:]' '[:lower:]')
    out="web/public/assets/tiles/$id"

    if [ -d "$out" ]; then
        echo "[WARN] Skip: $id (already tiled, delete $out to regenerate)"
        continue
    fi

    echo "[INFO] Tiling: $id"

    vips dzsave "$src" "$out" \
        --layout google \
        --tile-size 256 \
        --suffix=".webp[Q=92]"

    w=$(vipsheader -f width "$src")
    h=$(vipsheader -f height "$src")

    printf '{"width":%d,"height":%d}\n' "$w" "$h" > "$out/info.json"

    echo "       ${w}x${h} -> $out"
done

echo "[INFO] Done"
