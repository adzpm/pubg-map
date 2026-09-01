/** Tile edge length in pixels; must match the value used by scripts/build-tiles.sh. */
export const TILE_SIZE = 256

/** Leaflet {z}/{y}/{x} URL template for a map's tile pyramid, relative to Vite's BASE_URL. */
export const tileUrlTemplate = (id) => `${import.meta.env.BASE_URL}assets/tiles/${id}/{z}/{y}/{x}.webp`

/** URL of the tile set's info.json holding the source image dimensions. */
export const tileInfoUrl = (id) => `${import.meta.env.BASE_URL}assets/tiles/${id}/info.json`

/** Highest zoom with real tiles: there, one tile pixel equals one source-image pixel. */
export const computeMaxNativeZoom = (w, h) => Math.ceil(Math.log2(Math.max(w, h) / TILE_SIZE))

/** Fetches {width, height} (source-image pixels) for a map's tile set. */
export const fetchTileInfo = async (id) => {
    const r = await fetch(tileInfoUrl(id), { cache: 'force-cache' })
    if (!r.ok) throw new Error(`Tiles for "${id}" not found. Run scripts/build-tiles.sh first.`)
    return r.json()
}
