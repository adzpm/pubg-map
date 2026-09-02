# pubg-map-overlay

A frameless, always-on-top Electron window that projects [pubg.adz.pm](https://pubg.adz.pm) over your
game, Discord-style. It covers the display your cursor is on, sits above other windows at partial
opacity, and lives in the system tray — no window chrome, no taskbar entry.

## Windows x64 only

Release binaries target Windows x64 (NSIS installer + portable `.exe`) and nothing else, on purpose:

- PUBG: Battlegrounds only runs on Windows — there is no macOS or Linux client to overlay.
- Windows on ARM is out too: BattlEye blocks the game there, so an arm64 build would have nothing
  to sit on top of.

The app itself still starts on any OS for development (see below); only the shipped binaries are
win/x64.

## Usage

- `Alt+M` — global hotkey, toggles the overlay on/off (works while in-game)
- `Escape` — hides the overlay while it has focus
- Tray icon — click to toggle; the context menu offers:
  - opacity presets (50 / 65 / 75 / 90%, default 75%)
  - open [pubg.adz.pm](https://pubg.adz.pm) in your regular browser
  - exit

If `Alt+M` is already taken by another app, the tray tooltip and menu say so — the tray click still
toggles the overlay. Launching a second instance just shows the overlay of the one already running.
If the site fails to load (offline, DNS, ...), the overlay shows an error page and retries with
exponential backoff (2 s up to 30 s) while visible.

## Install

Grab a binary from [GitHub Releases](https://github.com/adzpm/pubg-map/releases) — every tagged
release ships both:

- `pubg-map-overlay-<version>-x64.exe` — NSIS installer (lets you pick the install directory)
- `pubg-map-overlay-<version>-x64-portable.exe` — portable, runs from anywhere, nothing to install

Or build from source, from the repository root:

```sh
task electron:build   # → overlay/dist/
```

## Dev run (any OS)

The overlay runs unpackaged on macOS and Linux too — handy for hacking on it without a Windows box:

```sh
task electron:dev
```

## Limitations

- **Exclusive fullscreen hides the overlay.** Like every overlay (Discord's included), it cannot
  draw over a game in exclusive-fullscreen mode. Run PUBG in **borderless windowed** mode.
- **The binaries are unsigned.** Windows SmartScreen will warn on first run — click
  **More info → Run anyway**. If you'd rather not trust a prebuilt `.exe`, build from source: the
  entire app is [one small main process](src/main.js).

## Security

The overlay renders a remote page, so the renderer is locked down:

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` — the page gets no Node.js
  access
- navigation is pinned to the `https://pubg.adz.pm` origin; `window.open` is denied, and `https:`
  links open in your default browser instead
