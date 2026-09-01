import { describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import { buildSecretRoomsLayer } from '@/lib/secrets'

vi.mock('@/data/secrets', () => ({
    SECRET_ROOMS: {
        testmap: [
            { x: 10, y: 20, name: 'Alpha' },
            { x: 30, y: 40 },
            { x: 50, y: 60, name: 'Custom', color: '#f00' },
            null,
            {},
            { y: 10, name: 'missing x' },
            { x: 10, name: 'missing y' },
            { x: '10', y: 20, name: 'string x' },
            { x: 10, y: '20', name: 'string y' },
        ],
        emptymap: [],
    },
}))

const toLL = (x, y) => L.latLng(y, x)

const markersOf = (mapId) => buildSecretRoomsLayer(mapId, toLL).getLayers()

const markerAt = (markers, x, y) => markers.find((m) => m.getLatLng().equals(toLL(x, y)))

describe('buildSecretRoomsLayer', () => {
    it('creates one marker per entry with numeric coordinates, skipping malformed ones', () => {
        const markers = markersOf('testmap')
        expect(markers).toHaveLength(3)
        expect(markerAt(markers, 10, 20)).toBeInstanceOf(L.Marker)
        expect(markerAt(markers, 30, 40)).toBeInstanceOf(L.Marker)
        expect(markerAt(markers, 50, 60)).toBeInstanceOf(L.Marker)
    })

    it('binds a tooltip only for named points', () => {
        const markers = markersOf('testmap')

        const named = markerAt(markers, 10, 20)
        expect(named.getTooltip()).toBeDefined()
        expect(named.getTooltip().getContent()).toBe('Alpha')

        const unnamed = markerAt(markers, 30, 40)
        expect(unnamed.getTooltip()).toBeUndefined()
    })

    it('uses the point color in the icon and caches icons per color', () => {
        const markers = markersOf('testmap')

        const custom = markerAt(markers, 50, 60)
        expect(custom.options.icon.options.html).toContain('#f00')

        const defaultA = markerAt(markers, 10, 20)
        const defaultB = markerAt(markers, 30, 40)
        expect(defaultA.options.icon.options.html).toContain('var(--bs-pink)')
        expect(defaultB.options.icon).toBe(defaultA.options.icon)
        expect(custom.options.icon).not.toBe(defaultA.options.icon)
    })

    it('returns an empty layer for maps without secret rooms', () => {
        expect(markersOf('emptymap')).toHaveLength(0)
        expect(markersOf('unknown-map')).toHaveLength(0)
    })
})
