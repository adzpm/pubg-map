import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import L from 'leaflet'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { fetchTileInfo } from '@/lib/tiles'

vi.mock('@/lib/tiles', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, fetchTileInfo: vi.fn() }
})

// alpha: 2048x1024 -> maxNativeZoom 3; beta: 1024x1024 -> maxNativeZoom 2
const ALPHA = { id: 'alpha', cells: { x: 8, y: 8 } }
const BETA = { id: 'beta', cells: { x: 4, y: 4 } }

const DIMS = {
    alpha: { width: 2048, height: 1024 },
    beta: { width: 1024, height: 1024 },
}

// container is 800x600, so for alpha: fit-by-width = 3 + log2(800/2048), fit-by-height = 3 + log2(600/1024)
const ALPHA_FIT_BY_WIDTH = 1.643856189774724
const ALPHA_FIT_BY_HEIGHT = 2.22881869049588
const BETA_FIT_BY_WIDTH = 2 + Math.log2(800 / 1024)
const BETA_FIT_BY_HEIGHT = 2 + Math.log2(600 / 1024)

describe('useLeafletMap', () => {
    let wrapper
    let container
    let currentMap
    let gridVisible
    let secretsVisible
    let onCursor
    let onMapClick
    let leaflet

    const mountMap = async () => {
        const containerRef = ref(container)
        const Harness = defineComponent({
            setup() {
                leaflet = useLeafletMap(containerRef, { currentMap, gridVisible, secretsVisible }, onCursor, onMapClick)
                return () => h('div')
            },
        })
        wrapper = mount(Harness)
        await flushPromises()
        return leaflet.map.value
    }

    // source-image pixels -> LatLng at the current map's maxNativeZoom (mirrors the composable's convention)
    const at = (px, py, maxZ = 3) => leaflet.map.value.unproject([px, py], maxZ)

    const hasHighlight = () => {
        let found = false
        leaflet.map.value.eachLayer((layer) => {
            if (layer instanceof L.Rectangle) found = true
        })
        return found
    }

    // zoom passed by showMap's setView; skips the setViews Leaflet itself issues while panning inside max bounds
    const initialViewZoom = (setViewSpy) => setViewSpy.mock.calls.find(([, , options]) => options?.animate === false)[1]

    const gridLineCount = () => {
        let count = 0
        leaflet.map.value.eachLayer((layer) => {
            if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) count++
        })
        return count
    }

    beforeEach(() => {
        fetchTileInfo.mockImplementation((id) => Promise.resolve(DIMS[id]))
        container = document.createElement('div')
        // jsdom has no layout; Leaflet reads these for map.getSize()
        Object.defineProperties(container, {
            clientWidth: { configurable: true, value: 800 },
            clientHeight: { configurable: true, value: 600 },
        })
        document.body.appendChild(container)
        currentMap = ref(ALPHA)
        gridVisible = ref(true)
        secretsVisible = ref(true)
        onCursor = vi.fn()
        onMapClick = vi.fn()
    })

    afterEach(() => {
        wrapper.unmount()
        container.remove()
        vi.clearAllMocks()
    })

    it('registers and enables the smoothZoom handler', async () => {
        const map = await mountMap()

        expect(map.smoothZoom).toBeInstanceOf(L.Handler)
        expect(map.smoothZoom.enabled()).toBe(true)

        container.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, cancelable: true }))
        expect(map.getPane('mapPane').style.transform).toContain('scale(')
    })

    it('sets min zoom so both axes fit and opens with the larger axis filling the viewport', async () => {
        // jsdom reports no 3d support, so Leaflet snaps applied zooms to integers; assert the requested zoom instead
        const setView = vi.spyOn(L.Map.prototype, 'setView')
        const map = await mountMap()

        expect(fetchTileInfo).toHaveBeenCalledWith('alpha')
        expect(map.getMinZoom()).toBeCloseTo(ALPHA_FIT_BY_WIDTH, 10)
        const initZoom = initialViewZoom(setView)
        expect(initZoom).toBeCloseTo(ALPHA_FIT_BY_HEIGHT, 10)
        expect(map.getMinZoom()).toBeLessThan(initZoom)
        setView.mockRestore()
    })

    it('reports cursor position and cell label for in-bounds moves', async () => {
        const map = await mountMap()

        // alpha cell size is 256x128, so (300, 200) is in column B, row 2
        map.fire('mousemove', { latlng: at(300, 200) })

        expect(onCursor).toHaveBeenLastCalledWith({ visible: true, px: 300, py: 200, cell: 'B2' })
        expect(hasHighlight()).toBe(true)

        map.fire('mousemove', { latlng: at(2048, 1024) })
        expect(onCursor).toHaveBeenLastCalledWith({ visible: true, px: 2048, py: 1024, cell: 'H8' })
    })

    it('clears the cursor and highlight when the pointer leaves the image', async () => {
        const map = await mountMap()
        const empty = { visible: false, px: 0, py: 0, cell: '' }

        map.fire('mousemove', { latlng: at(300, 200) })
        map.fire('mousemove', { latlng: at(2100, 200) })
        expect(onCursor).toHaveBeenLastCalledWith(empty)
        expect(hasHighlight()).toBe(false)

        map.fire('mousemove', { latlng: at(300, 200) })
        map.fire('mouseout')
        expect(onCursor).toHaveBeenLastCalledWith(empty)
        expect(hasHighlight()).toBe(false)
    })

    it('toggling gridVisible adds and removes the grid and suppresses the highlight', async () => {
        const map = await mountMap()

        expect(gridLineCount()).toBeGreaterThan(0)
        map.fire('mousemove', { latlng: at(300, 200) })
        expect(hasHighlight()).toBe(true)

        gridVisible.value = false
        await nextTick()
        expect(gridLineCount()).toBe(0)
        expect(hasHighlight()).toBe(false)

        map.fire('mousemove', { latlng: at(300, 200) })
        expect(hasHighlight()).toBe(false)
        expect(onCursor).toHaveBeenLastCalledWith({ visible: true, px: 300, py: 200, cell: 'B2' })

        gridVisible.value = true
        await nextTick()
        expect(gridLineCount()).toBeGreaterThan(0)
        map.fire('mousemove', { latlng: at(500, 200) })
        expect(hasHighlight()).toBe(true)
    })

    it('switches maps when currentMap changes and refits the zoom', async () => {
        const map = await mountMap()
        const setView = vi.spyOn(map, 'setView')

        currentMap.value = BETA
        await flushPromises()

        expect(fetchTileInfo).toHaveBeenLastCalledWith('beta')
        expect(map.getMinZoom()).toBeCloseTo(BETA_FIT_BY_HEIGHT, 10)
        expect(initialViewZoom(setView)).toBeCloseTo(BETA_FIT_BY_WIDTH, 10)
        setView.mockRestore()

        // beta cell size is 256x256, so (300, 700) is in column B, row 3
        map.fire('mousemove', { latlng: at(300, 700, 2) })
        expect(onCursor).toHaveBeenLastCalledWith({ visible: true, px: 300, py: 700, cell: 'B3' })
    })

    it('ignores currentMap updates that keep the same id', async () => {
        await mountMap()
        expect(fetchTileInfo).toHaveBeenCalledTimes(1)

        currentMap.value = { ...ALPHA }
        await flushPromises()

        expect(fetchTileInfo).toHaveBeenCalledTimes(1)
    })

    it('reports clicks in source-image pixels and drops out-of-bounds clicks', async () => {
        const map = await mountMap()

        map.fire('click', { latlng: at(100, 50) })
        expect(onMapClick).toHaveBeenCalledWith({ x: 100, y: 50 })

        onMapClick.mockClear()
        map.fire('click', { latlng: at(-5, 50) })
        map.fire('click', { latlng: at(100, 1030) })
        expect(onMapClick).not.toHaveBeenCalled()
    })
})
