/**
 * True inside the Electron overlay (overlay/): Electron's default user agent carries the app
 * name from overlay/package.json. The overlay has its own global shortcuts worth showing.
 */
export const isOverlay = (userAgent = globalThis.navigator?.userAgent ?? '') => userAgent.includes('pubg-map-overlay/')
