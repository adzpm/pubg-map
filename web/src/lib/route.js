/** Each map has its own address, /<map id>, so a map can be linked, bookmarked and found by search. */
export const pathForMap = (id) => `/${id}`

/** The map id a path names, or null for the home page and anything unknown. Exact case: the server has no /Erangel either. */
export const mapIdFromPath = (pathname, maps) => {
    const id = pathname.replace(/^\/+|\/+$/g, '')
    return maps.some((m) => m.id === id) ? id : null
}
