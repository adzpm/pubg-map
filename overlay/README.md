# pubg-map-overlay

Frameless, always-on-top Electron overlay for [pubg.adz.pm](https://pubg.adz.pm), Discord-style:
it covers the whole primary display at `0.75` opacity, stays above fullscreen games and lives in
the system tray.

## Usage

- `Alt+M` — global hotkey to toggle the overlay on/off (works while in-game)
- Tray menu — toggle the overlay or quit the app

## Run locally

From the repository root:

```sh
task electron:dev
```

## Build

Builds the Windows NSIS installer and a portable `.exe` into `overlay/dist/`:

```sh
task electron:build
```

## Security

The overlay loads a remote page, so the renderer is locked down:

- `contextIsolation: true`
- `sandbox: true`
- `nodeIntegration: false`
