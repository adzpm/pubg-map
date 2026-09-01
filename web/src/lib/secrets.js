import L from 'leaflet'
import { SECRET_ROOMS } from '@/data/secrets'

const DEFAULT_COLOR = 'var(--bs-pink)'

const iconCache = new Map()

const getIcon = (color) => {
    const key = color || DEFAULT_COLOR
    if (iconCache.has(key)) return iconCache.get(key)
    const icon = L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;background:transparent;border:2px solid ${key}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    })
    iconCache.set(key, icon)
    return icon
}

/** Builds a marker layer for a map's secret rooms; room x/y are source-image pixels projected with toLL. */
export const buildSecretRoomsLayer = (mapId, toLL) => {
    const layer = L.layerGroup()

    for (const p of SECRET_ROOMS[mapId] || []) {
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') continue
        const marker = L.marker(toLL(p.x, p.y), { icon: getIcon(p.color), riseOnHover: true })
        if (p.name) marker.bindTooltip(p.name, { direction: 'top', offset: [0, -12] })
        marker.addTo(layer)
    }

    return layer
}
