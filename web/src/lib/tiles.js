/** Tile edge length in pixels; must match the tiles produced by scripts/fetch-tiles.sh and scripts/build-tiles.sh. */
export const TILE_SIZE = 256

/**
 * Leaflet {z}/{y}/{x} URL template for a map's tile pyramid, relative to Vite's BASE_URL.
 * `version` (info.json) busts the immutable tile cache when a tile set is replaced.
 */
export const tileUrlTemplate = (id, version) =>
    `${import.meta.env.BASE_URL}assets/tiles/${id}/{z}/{y}/{x}.webp` +
    (version ? `?v=${encodeURIComponent(version)}` : '')

/** URL of the tile set's info.json holding the source image dimensions and tile version. */
export const tileInfoUrl = (id) => `${import.meta.env.BASE_URL}assets/tiles/${id}/info.json`

/** Highest zoom with real tiles: there, one tile pixel equals one source-image pixel. */
export const computeMaxNativeZoom = (w, h) => Math.ceil(Math.log2(Math.max(w, h) / TILE_SIZE))

/**
 * Fetches {width, height, version?} for a map's tile set. Always revalidated (cheap 304), so a
 * tile update reaches clients instead of the old version being pinned by the HTTP cache.
 */
export const fetchTileInfo = async (id) => {
    const r = await fetch(tileInfoUrl(id), { cache: 'no-cache' })
    if (!r.ok) throw new Error(`Tiles for "${id}" not found. Run scripts/fetch-tiles.sh first.`)
    return r.json()
}
