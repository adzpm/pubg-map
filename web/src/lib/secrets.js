import L from 'leaflet'
import {SECRET_ROOMS} from '@/data/secrets'

export const buildSecretRoomsLayer = (mapId, toLL) => {
    const layer = L.layerGroup()

    const icon = L.divIcon({
        className: 'secret-room-marker',
        html: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    })

    for (const p of SECRET_ROOMS[mapId] || []) {
        const marker = L.marker(toLL(p.x, p.y), {icon, riseOnHover: true})
        if (p.name) marker.bindTooltip(p.name, {direction: 'top', offset: [0, -12]})
        marker.addTo(layer)
    }

    return layer
}
