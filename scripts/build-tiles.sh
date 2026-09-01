#!/usr/bin/env bash
#
# Slices assets/maps/*.png into Google-layout 256px .webp tile pyramids under
# web/public/assets/tiles/<map-id>/ and writes info.json with source dimensions.
# Requires libvips (vips, vipsheader). Idempotent: maps whose info.json already
# exists are skipped; a tile directory without info.json is an interrupted run
# and is wiped and re-tiled (info.json is written last, so it marks completion).

set -euo pipefail

if ! command -v vips > /dev/null 2>&1; then
    echo "[ERROR] 'vips' not found. Install libvips (e.g. 'brew install vips' or 'apt install libvips-tools')" >&2
    exit 1
fi

cd "$(dirname "$0")/.."

mkdir -p web/public/assets/tiles

shopt -s nullglob

for src in assets/maps/*.png; do
    base=$(basename "$src" .png)
    id=$(echo "$base" | tr '[:upper:]' '[:lower:]')
    out="web/public/assets/tiles/$id"

    if [ -f "$out/info.json" ]; then
        echo "[WARN] Skip: $id (already tiled, delete $out to regenerate)"
        continue
    fi

    if [ -d "$out" ]; then
        echo "[WARN] Incomplete tile dir (no info.json), re-tiling: $out"
        rm -rf "$out"
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
