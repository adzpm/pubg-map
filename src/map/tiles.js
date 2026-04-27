import {TILE_SIZE} from '../constants.js'

export const computeMaxNativeZoom = (w, h) => Math.ceil(Math.log2(Math.max(w, h) / TILE_SIZE))

export const fetchTileInfo = async (id) => {
    const r = await fetch(`assets/tiles/${id}/info.json`, {cache: 'force-cache'})
    if (!r.ok) throw new Error(`Tiles for "${id}" not found. Run scripts/build-tiles.sh first.`)
    return r.json()
}
