import L from 'leaflet'
import { VEHICLES } from '@/data/vehicles'

const SIZE = 24

/** Number of vehicle spawn spots on a map (0 when the map has none). */
export const vehicleSpotCount = (mapId) => VEHICLES[mapId]?.spots.length ?? 0

/** True when a group's spots get a vehicle every match. */
export const isGuaranteed = (group) => group.chance >= 100

/** The number written on a spot: whole percent, but never 0 for a spot that can spawn or 100 for one that can miss. */
export const chanceLabel = (group) => {
    if (isGuaranteed(group)) return '100'
    return String(Math.min(99, Math.max(1, Math.round(group.chance))))
}

/** Table rows the map cannot show because the game files do not say where they spawn. */
export const unplacedVehicles = (mapId) =>
    (VEHICLES[mapId]?.unplaced ?? []).map((u) => `${u.name} (${countText(u.count)} per match)`)

function countText(count) {
    return Array.isArray(count) ? `${count[0]}–${count[1]}` : String(count)
}

/** Tooltip text: what the group is, the odds in plain words, and what can spawn there. */
export const describeGroup = (group) => {
    const odds = isGuaranteed(group)
        ? `Fixed spawn: a vehicle on each of these ${group.spots} points every match`
        : `About ${chanceLabel(group)}% each: ${countText(group.count)} vehicles per match across ${group.spots} points`
    const what = group.vehicles.length > 0 ? group.vehicles.join(', ') : ''
    return [group.name, odds, what].filter(Boolean)
}

const escapeHtml = (text) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const buildIcon = (group) =>
    L.divIcon({
        className: '',
        html: `<div class="vehicle-spot ${group.kind}${isGuaranteed(group) ? ' guaranteed' : ''}">${chanceLabel(group)}</div>`,
        iconSize: [SIZE, SIZE],
        iconAnchor: [SIZE / 2, SIZE / 2],
    })

/** Builds the vehicle spawn layer for a map: one chip per spot with its chance; x/y are source-image pixels projected with toLL. */
export const buildVehiclesLayer = (mapId, toLL) => {
    const layer = L.layerGroup()
    const data = VEHICLES[mapId]
    if (!data) return layer

    // one icon and one tooltip text per group, shared by all of its spots
    const icons = data.groups.map(buildIcon)
    const tips = data.groups.map((group) => {
        const [name, ...rest] = describeGroup(group).map(escapeHtml)
        return `<strong>${name}</strong><br>${rest.join('<br>')}`
    })

    for (const [x, y, g] of data.spots) {
        if (!icons[g]) continue
        L.marker(toLL(x, y), { icon: icons[g], keyboard: false })
            .bindTooltip(tips[g], { direction: 'top', offset: [0, -SIZE / 2] })
            .addTo(layer)
    }

    return layer
}
