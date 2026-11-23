# pubg-map

Interactive PUBG battleground maps — deep-zoom tiled imagery, a live coordinate grid and secret-room markers, soon at [pubg.adz.pm](https://pubg.adz.pm).

[![CI](https://github.com/adzpm/pubg-map/actions/workflows/ci.yml/badge.svg)](https://github.com/adzpm/pubg-map/actions/workflows/ci.yml)
[![Release](https://github.com/adzpm/pubg-map/actions/workflows/release.yml/badge.svg)](https://github.com/adzpm/pubg-map/actions/workflows/release.yml)
[![Latest release](https://img.shields.io/github/v/release/adzpm/pubg-map?sort=semver)](https://github.com/adzpm/pubg-map/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![screenshot.png](screenshot.png)

## Why it exists

PUBG community resources are scattered across PNG dumps, Reddit threads, and dead wikis. The official assets are
gorgeous — until you try to actually *use* them. Open one in a browser and your tab dies; open it in an image viewer and
you lose the grid, the coordinates, and any community knowledge layered on top.

`pubg-map` treats those assets the way Mapbox treats a city: tile them, project them onto `L.CRS.Simple`, and let
Leaflet do what it does best. Then layer game data on top.

## Features

- **All 9 Battlegrounds maps** — Erangel, Miramar, Vikendi, Taego, Deston, Rondo, Sanhok, Paramo, Karakin.
- **Deep-zoom tiles, kept current** — 256px WebP pyramids (8192px per map) synced from [pubg.gs](https://pubg.gs/maps/),
  which extracts the imagery from the live game build, so panning and zooming stays sharp from the world view down to
  the pixel. The ~12k tiles are committed, so cloning the repo is all you need; each tile set carries a version that
  busts browser and PWA caches when the maps are refreshed.
- **Live grid + cell highlight** — main grid (A–H × 1–8 on the big maps, scaled down to 2×2 on Karakin) plus 10×
  sub-divisions, each cell 1 km in-game. Column letters and row numbers stay pinned to the screen edges at any zoom, and
  the square under the cursor lights up there and in the map window.
- **Floating map window** — map picker, layers and the current square in one window you can drag anywhere (it sticks
  to screen edges) and fold into a single bar; it remembers where you left it. Every shortcut is shown as a keycap next to
  its control: `1`–`9` pick a map, `G` toggles the grid, `R` the secret rooms, `V` vehicle spawns, `F` folds the
  window; inside the overlay
  the window also lists `Alt+M` and `Esc`.
- **Secret-rooms layer** — 117 rooms on Erangel, Miramar, Taego, Deston, Rondo, Paramo and Vikendi, checked against the
  game's own loot data where it exposes them and against the map imagery elsewhere.
- **Vehicle spawns layer** — every spawn point from the game files with its chance written on it (vehicles per match
  divided by the group's spawn points); fixed spawns that get a vehicle every match are drawn solid, boats and gliders
  have their own colours. Off by default, `V` toggles it. `task vehicles:build` refreshes the data after a patch.
- **A page per map** — every map has its own address (`/erangel`, `/taego`, …) that can be linked and bookmarked. The
  build writes a static page for each with its own title, description, text, link preview image and structured data,
  plus `sitemap.xml`, `robots.txt` and a real 404 page, so search engines index the maps separately.
- **PWA offline caching** — `vite-plugin-pwa` precaches the app shell and caches map tiles at runtime, so the maps you
  have opened keep working without a connection.
- **Smooth zoom** — a custom Leaflet handler replaces the stepped scroll-wheel zoom with a fluent, fractional one.
- **Hidden dev mode** — type `D` `E` `V` to unlock a status bar with cell/pixel coordinates and a
  copy-coordinates click tool.

## Quick start

Prerequisites: [Node.js](https://nodejs.org) >= 24 and [Task](https://taskfile.dev). `curl` is needed to refresh the
tiles, `libvips` only to tile your own PNGs.

```sh
git clone https://github.com/adzpm/pubg-map.git
cd pubg-map
task dev
```

The dev server starts on [http://localhost:5180](http://localhost:5180) with HMR. Without Task:

```sh
cd web
npm install
npm run dev
```

`task build` produces the production bundle in `web/dist/`, `task preview` serves it locally.

## Architecture

```mermaid
flowchart LR
  subgraph Tiles
    GS[pubg.gs tile CDN] --> FT[scripts/fetch-tiles.sh<br>curl]
    FT --> PYR[WebP pyramid + info.json<br>web/public/assets/tiles/]
    PNG[assets/maps/*.png] --> BT[scripts/build-tiles.sh<br>vips dzsave]
    BT --> PYR
  end
  subgraph App
    PYR --> VITE[Vite + Vue 3 SPA]
    VITE --> LEAF[Leaflet on L.CRS.Simple<br>grid / secrets / dev tools]
  end
  subgraph Deploy
    VITE --> DOCKER[docker/Dockerfile] --> NGINX[nginx-unprivileged :8080] --> HELM[helm/pubg-map] --> K8S[Kubernetes]
  end
```

```
├── assets/maps/           source PNGs (not committed; see "Bringing your own maps")
├── scripts/fetch-tiles.sh sync tile pyramids from pubg.gs, skips up-to-date maps
├── scripts/build-vehicles.mjs vehicle spawn spots and chances from pubg.gs level dumps
├── scripts/build-tiles.sh PNG -> WebP pyramid via libvips, idempotent
├── scripts/build-og.sh    link preview images (web/public/og) from the tiles
├── web/                   Vue 3 + Leaflet SPA (Vite, PWA)
│   ├── public/assets/tiles/  generated tile pyramids, committed
│   ├── seo/               static page per map, sitemap, robots.txt, 404 (Vite plugin)
│   ├── src/components/    map viewer with edge labels, floating map window, status bar
│   ├── src/composables/   leaflet map, floating window, hotkeys, dev mode, dev tools, persistent refs
│   ├── src/lib/           grid, secrets, tiles, smooth zoom, dev tools
│   ├── src/data/          map registry (maps.js) and secret rooms (secrets.js)
│   └── tests/             Vitest suites mirroring src/
├── overlay/               Electron in-game overlay (Windows)
├── docker/                Dockerfile, nginx.conf, docker-compose.yml
├── helm/pubg-map/         Helm chart
└── Taskfile.yml           all entry points: task --list
```

## Updating the maps

```sh
task tiles:fetch                       # every map whose remote version changed
task tiles:fetch -- rondo taego        # only these maps
task tiles:fetch -- --force erangel    # re-download even if up to date
```

`scripts/fetch-tiles.sh` reads each map's tile manifest from `https://pubg.gs/maps/<id>/` (CDN URL, zoom levels, size
and a content hash), downloads the full z0–5 pyramid, remaps it from the remote `{z}/{x}/{y}` to our `{z}/{y}/{x}`
layout, checks that every tile is present and is a WebP, and only then swaps the directory in. The hash is written to
`info.json` as `version`; the app appends it to tile URLs (`?v=<hash>`), so the year-long immutable cache on tiles never
serves an outdated map. After an update, re-check secret-room coordinates on reworked areas.

The link preview images are cut from the tiles; run `task og:build` after a map changes noticeably.

## Bringing your own maps

1. Drop a high-resolution PNG into `assets/maps/`. Filename = map id (lowercased): `erangel.png`, `karakin.png`, ...
2. Run `task tiles:generate`. Tiles land in `web/public/assets/tiles/<id>/{z}/{y}/{x}.webp` plus an `info.json` with
   the source dimensions. Already-tiled maps are skipped; `task tiles:lint` lists PNGs that have no tiles yet.
3. Add an entry in [`web/src/data/maps.js`](web/src/data/maps.js) — the `cells` value defines the grid (Erangel is
   `8×8`, Karakin is `2×2`, each cell maps to 1 km in-game).
4. (Optional) Add secret-room coordinates to [`web/src/data/secrets.js`](web/src/data/secrets.js). Coordinates are in
   source-image pixels — the dev-mode click tool copies them in exactly the format `secrets.js` expects.

## Dev mode

Type `D` `E` `V` (within 5 seconds, outside form fields) to toggle dev mode; the flag persists across reloads. It
adds a dev section to the map window with:

- **Status bar** — the current grid cell and source-image pixel coordinates under the cursor, so screenshots and
  callouts share the same vocabulary.
- **Copy coordinates** — click anywhere on the map to copy `{ x: ..., y: ..., name: '...' }` to the clipboard, ready to
  paste into `secrets.js`.

## Deployment

The production image is a two-stage build: `node:26.13.1-alpine` builds the bundle,
`nginxinc/nginx-unprivileged:1.31.7-alpine` serves it as uid 101 on port 8080, with the full tile tree baked in and a
`GET /healthz` endpoint answering `ok`.

### Docker

Build and run locally:

```sh
task docker:build   # docker build -f docker/Dockerfile
task docker:run     # serves on http://localhost:8080
```

With compose (binds `127.0.0.1:8083`):

```sh
task docker:up      # docker compose -f docker/docker-compose.yml up -d --build
task docker:down
```

After the first tagged release, the published image can be pulled straight from GHCR:

```sh
docker run --rm -p 8080:8080 ghcr.io/adzpm/pubg-map:0.1.0
```

### Helm

From the repo:

```sh
helm install pubg-map ./helm/pubg-map
kubectl port-forward svc/pubg-map 8080:80
```

Or from the OCI registry (available after the first tagged release):

```sh
helm install pubg-map oci://ghcr.io/adzpm/charts/pubg-map --version 0.1.0
```

The deployment is hardened by default: non-root, read-only root filesystem, dropped capabilities, seccomp
`RuntimeDefault`, probes on `/healthz`. Values worth knowing:

| Value | Default | Purpose |
| --- | --- | --- |
| `image.repository` / `image.tag` | `ghcr.io/adzpm/pubg-map` / chart `appVersion` | Image to run |
| `ingress.enabled` / `ingress.hosts` | `false` / `pubg-map.local` | Expose the site through an Ingress |
| `resources` | `10m` cpu / `32Mi`–`128Mi` memory | Sized for nginx serving static files; no cpu limit on purpose |
| `autoscaling.enabled` | `false` | HPA between 1 and 3 replicas at 80% cpu |

The full reference lives in [`helm/pubg-map/README.md`](helm/pubg-map/README.md) and
[`values.yaml`](helm/pubg-map/values.yaml); values are validated by `values.schema.json`.

## Testing & quality

```sh
task lint       # eslint (flat config, vue + prettier-compat)
task format     # prettier --write
task test       # vitest, jsdom + @vue/test-utils
```

Tests live in `web/tests/` mirroring `src/`; `npm run coverage` adds a V8 coverage report and `npm run test:watch`
keeps Vitest running. CI runs `lint`, `format:check`, `test` and `build` on Node 26, builds the Docker image, and
lints/templates the Helm chart on every pull request and push to `main`. Tagged `vX.Y.Z` releases push the multi-arch
image to `ghcr.io/adzpm/pubg-map`, push the chart to `oci://ghcr.io/adzpm/charts` and create a GitHub Release
with the Windows x64 overlay binaries attached.

## In-game overlay

`overlay/` contains a frameless, always-on-top Electron overlay that projects the site over your game,
Discord-style — toggle it with the global `Alt+M` hotkey. A Windows x64 installer and a portable `.exe` are
attached to each [GitHub Release](https://github.com/adzpm/pubg-map/releases) (run PUBG in borderless
windowed mode — no overlay can draw over exclusive fullscreen). Run it locally with `task electron:dev`,
build the binaries with `task electron:build`. Details in [`overlay/README.md`](overlay/README.md).

## Credits

Map imagery is extracted from the game by [pubg.gs](https://pubg.gs/maps/).
Earlier tile sets came from the official [pubg/api-assets](https://github.com/pubg/api-assets) repository, which has
not been updated since patch 31.2 (October 2024).

## License

The code is released under the [MIT License](LICENSE). Map imagery and other PUBG: Battlegrounds assets are the
property of KRAFTON, Inc. — the MIT license does not cover them.
