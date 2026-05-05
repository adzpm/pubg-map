import {TILE_SIZE} from '@/config'

export const tileUrlTemplate = (id) =>
    `${import.meta.env.BASE_URL}assets/tiles/${id}/{z}/{y}/{x}.webp`

export const tileInfoUrl = (id) =>
    `${import.meta.env.BASE_URL}assets/tiles/${id}/info.json`

export const computeMaxNativeZoom = (w, h) =>
    Math.ceil(Math.log2(Math.max(w, h) / TILE_SIZE))

export const fetchTileInfo = async (id) => {
    const r = await fetch(tileInfoUrl(id), {cache: 'force-cache'})
    if (!r.ok) throw new Error(`Tiles for "${id}" not found. Run scripts/build-tiles.sh first.`)
    return r.json()
}
