import { describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import { buildGridLayer, createCellHighlight } from '@/lib/grid'

// Identity projection: source pixel (x, y) -> LatLng(y, x), so lng mirrors x and lat mirrors y
const toLL = (x, y) => L.latLng(y, x)

describe('buildGridLayer', () => {
    const cells = { x: 2, y: 3 }
    const w = 200
    const h = 300

    const build = () => {
        const layers = buildGridLayer(cells, w, h, toLL).getLayers()
        return {
            layers,
            polylines: layers.filter((layer) => layer instanceof L.Polyline),
            markers: layers.filter((layer) => layer instanceof L.Marker),
        }
    }

    it('draws 9 sublines per cell axis plus one main line per cell boundary', () => {
        const { polylines } = build()
        const sub = polylines.filter((p) => p.options.className === 'pubg-grid-subline')
        const main = polylines.filter((p) => p.options.className === 'pubg-grid-line')

        expect(sub).toHaveLength(9 * (cells.x + cells.y))
        expect(main).toHaveLength(cells.x + 1 + (cells.y + 1))
        expect(polylines).toHaveLength(sub.length + main.length)
    })

    it('spans main lines across the full image at every cell boundary', () => {
        const { polylines } = build()
        const main = polylines.filter((p) => p.options.className === 'pubg-grid-line')
        const spans = main.map((p) => p.getLatLngs().map((ll) => [ll.lat, ll.lng]))

        for (let i = 0; i <= cells.x; i++) {
            const x = (i * w) / cells.x
            expect(spans).toContainEqual([
                [0, x],
                [h, x],
            ])
        }
        for (let j = 0; j <= cells.y; j++) {
            const y = (j * h) / cells.y
            expect(spans).toContainEqual([
                [y, 0],
                [y, w],
            ])
        }
    })

    it('labels columns with letters and rows with numbers, centered on their cells', () => {
        const { markers } = build()
        expect(markers).toHaveLength(cells.x + cells.y)

        const byHtml = new Map(markers.map((m) => [m.options.icon.options.html, m.getLatLng()]))
        expect([...byHtml.keys()].sort()).toEqual(['1', '2', '3', 'A', 'B'])

        expect(byHtml.get('A')).toMatchObject({ lat: 0, lng: 50 })
        expect(byHtml.get('B')).toMatchObject({ lat: 0, lng: 150 })
        expect(byHtml.get('1')).toMatchObject({ lat: 50, lng: 0 })
        expect(byHtml.get('3')).toMatchObject({ lat: 250, lng: 0 })
    })

    it('keeps every grid element non-interactive', () => {
        const { layers } = build()
        expect(layers.length).toBeGreaterThan(0)
        for (const layer of layers) expect(layer.options.interactive).toBe(false)
    })
})

describe('createCellHighlight', () => {
    const cells = { x: 4, y: 4 }
    const w = 400
    const h = 400

    const fakeMap = () => ({ addLayer: vi.fn(), removeLayer: vi.fn() })

    it('adds a rectangle covering the requested cell on show', () => {
        const map = fakeMap()
        const highlight = createCellHighlight(cells, w, h, toLL)

        highlight.show(map, 1, 2)

        expect(map.addLayer).toHaveBeenCalledTimes(1)
        const rect = map.addLayer.mock.calls[0][0]
        expect(rect).toBeInstanceOf(L.Rectangle)

        const bounds = rect.getBounds()
        expect(bounds.getWest()).toBe(100)
        expect(bounds.getEast()).toBe(200)
        expect(bounds.getSouth()).toBe(200)
        expect(bounds.getNorth()).toBe(300)
    })

    it('is a no-op when showing the same cell again', () => {
        const map = fakeMap()
        const highlight = createCellHighlight(cells, w, h, toLL)

        highlight.show(map, 0, 0)
        highlight.show(map, 0, 0)

        expect(map.addLayer).toHaveBeenCalledTimes(1)
    })

    it('reuses the same rectangle when moving between cells', () => {
        const map = fakeMap()
        const highlight = createCellHighlight(cells, w, h, toLL)

        highlight.show(map, 0, 0)
        const rect = map.addLayer.mock.calls[0][0]

        highlight.show(map, 3, 1)

        expect(map.addLayer).toHaveBeenCalledTimes(1)
        expect(map.removeLayer).not.toHaveBeenCalled()

        const bounds = rect.getBounds()
        expect(bounds.getWest()).toBe(300)
        expect(bounds.getEast()).toBe(400)
        expect(bounds.getSouth()).toBe(100)
        expect(bounds.getNorth()).toBe(200)
    })

    it('removes the rectangle on hide and tolerates repeated hides', () => {
        const map = fakeMap()
        const highlight = createCellHighlight(cells, w, h, toLL)

        highlight.hide(map)
        expect(map.removeLayer).not.toHaveBeenCalled()

        highlight.show(map, 0, 0)
        const rect = map.addLayer.mock.calls[0][0]

        highlight.hide(map)
        highlight.hide(map)

        expect(map.removeLayer).toHaveBeenCalledExactlyOnceWith(rect)
    })

    it('creates a fresh rectangle after hide, even for the previously shown cell', () => {
        const map = fakeMap()
        const highlight = createCellHighlight(cells, w, h, toLL)

        highlight.show(map, 2, 2)
        highlight.hide(map)
        highlight.show(map, 2, 2)

        expect(map.addLayer).toHaveBeenCalledTimes(2)
        expect(map.addLayer.mock.calls[1][0]).not.toBe(map.addLayer.mock.calls[0][0])
    })
})
