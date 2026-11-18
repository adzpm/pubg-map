#!/usr/bin/env bash
#
# Downloads up-to-date map tile pyramids from pubg.gs (imagery extracted from the
# game files) into
# web/public/assets/tiles/<map-id>/{z}/{y}/{x}.webp and writes info.json.
#
# Usage: scripts/fetch-tiles.sh [--force] [map-id ...]
#   map-id   pubg.gs slug, same as our id (default: every map in DEFAULT_MAPS)
#   --force  re-download even if the local tile set already has the remote version
#
# Each map's manifest on https://pubg.gs/maps/<id>/ carries a content hash. It is
# stored as info.json "version"; the web app appends it to tile URLs to bust the
# year-long immutable cache. A map whose local version matches is skipped.
# Tiles are staged in a temp dir, validated, then swapped in; info.json is
# written last, so a tile dir without it is an interrupted run.

set -euo pipefail

DEFAULT_MAPS=(erangel miramar vikendi taego deston rondo sanhok paramo karakin)
SITE=https://pubg.gs/maps
PARALLEL=${PARALLEL:-16}
UA="pubg-map-tile-sync (+https://github.com/adzpm/pubg-map)"

if ! command -v curl > /dev/null 2>&1; then
    echo "[ERROR] 'curl' not found" >&2
    exit 1
fi

cd "$(dirname "$0")/.."

force=0
maps=()
for arg in "$@"; do
    case "$arg" in
        --force) force=1 ;;
        -h | --help)
            sed -n '3,10p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        -*)
            echo "[ERROR] Unknown option: $arg" >&2
            exit 1
            ;;
        *) maps+=("$arg") ;;
    esac
done
[ ${#maps[@]} -gt 0 ] || maps=("${DEFAULT_MAPS[@]}")

staging=$(mktemp -d)
trap 'rm -rf "$staging"' EXIT

# Pulls one field out of the manifest. The manifest is embedded in the page as
# escaped JSON inside the Next.js payload: slug":"<id>","tiles":{"hash":"..",...}
field() { # <manifest> <key>
    printf '%s' "$1" | grep -oE "\"$2\":(\"[^\"]*\"|[0-9]+)" | head -n1 | cut -d: -f2- | tr -d '"'
}

is_webp() { # RIFF....WEBP
    [ "$(head -c 4 "$1")" = "RIFF" ] && [ "$(head -c 12 "$1" | tail -c 4)" = "WEBP" ]
}

failed=()

for id in "${maps[@]}"; do
    out="web/public/assets/tiles/$id"

    manifest=$(curl -fsSL -A "$UA" "$SITE/$id/" |
        sed 's/\\"/"/g' |
        grep -oE "\"slug\":\"$id\",\"tiles\":\{[^}]+\}" |
        head -n1) || true

    if [ -z "$manifest" ]; then
        echo "[ERROR] $id: tile manifest not found on $SITE/$id/ (page layout changed?)" >&2
        failed+=("$id")
        continue
    fi

    url=$(field "$manifest" url)
    hash=$(field "$manifest" hash)
    max_zoom=$(field "$manifest" maxZoom)
    px=$(field "$manifest" px)
    size=$(field "$manifest" size)

    if [ "$size" != 256 ] || [ -z "$url" ] || [ -z "$hash" ] || [ -z "$max_zoom" ] || [ -z "$px" ]; then
        echo "[ERROR] $id: unexpected manifest: $manifest" >&2
        failed+=("$id")
        continue
    fi

    if [ $force -eq 0 ] && [ -f "$out/info.json" ] && grep -q "\"version\":\"$hash\"" "$out/info.json"; then
        echo "[INFO] Skip: $id (up to date, version $hash)"
        continue
    fi

    echo "[INFO] Fetching: $id (version $hash, ${px}px, z0-$max_zoom) from $url"

    dir="$staging/$id"
    cfg="$staging/$id.curl"
    expected=0
    : > "$cfg"
    for ((z = 0; z <= max_zoom; z++)); do
        n=$((1 << z))
        for ((x = 0; x < n; x++)); do
            for ((y = 0; y < n; y++)); do
                # remote layout is {z}/{x}/{y}, ours is {z}/{y}/{x}
                printf 'url = "%s/%d/%d/%d.webp"\noutput = "%s/%d/%d/%d.webp"\n' \
                    "$url" "$z" "$x" "$y" "$dir" "$z" "$y" "$x" >> "$cfg"
                expected=$((expected + 1))
            done
        done
    done

    curl --parallel --parallel-max "$PARALLEL" --fail --silent --show-error \
        --retry 3 --retry-delay 2 --create-dirs -A "$UA" -K "$cfg" || true

    got=0
    bad=0
    while IFS= read -r -d '' f; do
        got=$((got + 1))
        is_webp "$f" || {
            echo "[ERROR] $id: not a WebP: ${f#"$staging/"}" >&2
            bad=$((bad + 1))
        }
    done < <(find "$dir" -type f -name '*.webp' -print0 2> /dev/null)

    if [ "$got" -ne "$expected" ] || [ "$bad" -ne 0 ]; then
        echo "[ERROR] $id: got $got/$expected valid tiles ($bad invalid), keeping the current tiles" >&2
        failed+=("$id")
        continue
    fi

    printf '{"width":%d,"height":%d,"version":"%s","source":"%s/%s/"}\n' \
        "$px" "$px" "$hash" "$SITE" "$id" > "$dir/info.json.new"

    rm -rf "$out"
    mkdir -p "$(dirname "$out")"
    mv "$dir" "$out"
    mv "$out/info.json.new" "$out/info.json"

    echo "       $expected tiles -> $out"
done

if [ ${#failed[@]} -gt 0 ]; then
    echo "[ERROR] Failed: ${failed[*]}" >&2
    exit 1
fi

echo "[INFO] Done"
