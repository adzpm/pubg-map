import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import L from 'leaflet'
import { computeMaxNativeZoom, fetchTileInfo, tileUrlTemplate, TILE_SIZE } from '@/lib/tiles'
import { buildGridLayer, cellName, createCellHighlight, gridAxes } from '@/lib/grid'
import { buildSecretRoomsLayer } from '@/lib/secrets'
import { buildVehiclesLayer } from '@/lib/vehicles'
import '@/lib/smooth-zoom'

const ZOOM_HEADROOM = 8

const MAP_OPTIONS = {
    crs: L.CRS.Simple,
    zoomSnap: 0,
    zoomDelta: 0.5,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    smoothZoom: true,
    smoothZoomSensitivity: 0.005,
    smoothZoomSettleMs: 140,
}

const EMPTY_CURSOR = { visible: false, px: 0, py: 0, cell: '', col: -1, row: -1 }
const NO_AXES = { cols: [], rows: [] }

/**
 * Mounts a Leaflet map into `container` and keeps it in sync with the given reactive state.
 * Cursor and click positions are reported in source-image pixels (origin top-left).
 */
export const useLeafletMap = (
    container,
    { currentMap, gridVisible, secretsVisible, vehiclesVisible },
    onCursor,
    onMapClick,
) => {
    const map = shallowRef(null)
    // screen extents of grid columns/rows, for labels pinned to the screen edges
    const axes = shallowRef(NO_AXES)

    let baseLayer = null
    let gridLayer = null
    let secretsLayer = null
    let vehiclesLayer = null
    let highlight = null
    let dims = null
    let mapBounds = null

    // Zoom at which one container axis exactly fits the image axis (0 when sizes are unknown).
    const fitZoomForAxis = (containerSide, imageSide) => {
        if (containerSide <= 0 || imageSide <= 0) return 0
        return dims.maxZ + Math.log2(containerSide / imageSide)
    }

    // min: both axes fit (no panning out of bounds); init: the larger axis fills the viewport.
    const fitZooms = () => {
        if (!map.value || !dims) return { min: 0, init: 0 }
        const size = map.value.getSize()
        const byWidth = fitZoomForAxis(size.x, dims.w)
        const byHeight = fitZoomForAxis(size.y, dims.h)
        return { min: Math.min(byWidth, byHeight), init: Math.max(byWidth, byHeight) }
    }

    const applyMinZoom = () => {
        if (!map.value || !mapBounds) return
        const { min: minZoom } = fitZooms()
        map.value.setMinZoom(minZoom)
        if (map.value.getZoom() < minZoom) map.value.setZoom(minZoom)
    }

    // A zoom in flight: Leaflet's animated zoom ({ center, zoom }) or the smooth-zoom CSS scale
    // ({ scale, origin }). Container points are projected to where they will be on screen.
    let liveZoom = null

    const toContainer = (latlng) => {
        const m = map.value
        if (liveZoom?.center) {
            const half = m.getSize().divideBy(2)
            return m.project(latlng, liveZoom.zoom).subtract(m.project(liveZoom.center, liveZoom.zoom)).add(half)
        }
        const p = m.latLngToContainerPoint(latlng)
        if (liveZoom?.origin) return liveZoom.origin.add(p.subtract(liveZoom.origin).multiplyBy(liveZoom.scale))
        return p
    }

    const updateAxes = () => {
        if (!map.value || !dims) {
            axes.value = NO_AXES
            return
        }
        const { w, h, maxZ, cells } = dims
        axes.value = gridAxes(cells, w, h, (x, y) => toContainer(map.value.unproject([x, y], maxZ)))
    }

    const cleanupLayers = () => {
        if (highlight) highlight.hide(map.value)
        for (const layer of [baseLayer, gridLayer, secretsLayer, vehiclesLayer]) {
            if (layer) map.value.removeLayer(layer)
        }
        baseLayer = gridLayer = secretsLayer = vehiclesLayer = highlight = null
    }

    const showMap = async (def) => {
        cleanupLayers()

        const { width: w, height: h, version } = await fetchTileInfo(def.id)
        const maxNativeZoom = computeMaxNativeZoom(w, h)
        const maxZoom = maxNativeZoom + ZOOM_HEADROOM
        // toLL: source-image pixels -> LatLng, projected at maxNativeZoom (1 px == 1 CRS unit there)
        const toLL = (px, py) => map.value.unproject([px, py], maxNativeZoom)
        const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0))

        dims = { w, h, maxZ: maxNativeZoom, cells: def.cells }
        mapBounds = bounds

        baseLayer = L.tileLayer(tileUrlTemplate(def.id, version), {
            tileSize: TILE_SIZE,
            minNativeZoom: 0,
            maxNativeZoom,
            maxZoom,
            bounds,
            noWrap: true,
            keepBuffer: 8,
        }).addTo(map.value)

        gridLayer = buildGridLayer(def.cells, w, h, toLL)
        if (gridVisible.value) gridLayer.addTo(map.value)

        secretsLayer = buildSecretRoomsLayer(def.id, toLL)
        if (secretsVisible.value) secretsLayer.addTo(map.value)

        // hundreds of markers: built only once the layer is first shown
        if (vehiclesVisible?.value) showVehicles(def.id, toLL)

        highlight = createCellHighlight(def.cells, w, h, toLL)

        map.value.setMaxZoom(maxZoom)
        map.value.setMaxBounds(bounds)

        const { min: minZoom, init: initZoom } = fitZooms()
        map.value.setMinZoom(minZoom)
        map.value.setView(bounds.getCenter(), initZoom, { animate: false })
        updateAxes()
        updateDensity()
    }

    const showVehicles = (mapId, toLL) => {
        vehiclesLayer ??= buildVehiclesLayer(mapId, toLL)
        vehiclesLayer.addTo(map.value)
    }

    // Chips with a number are unreadable when the whole map is on screen: below this many screen
    // pixels per kilometre they shrink to plain dots (CSS, .vehicles-compact).
    const COMPACT_BELOW_PX_PER_KM = 170
    const updateDensity = () => {
        if (!map.value || !dims) return
        const cellPx = (dims.w / dims.cells.x) * map.value.getZoomScale(map.value.getZoom(), dims.maxZ)
        container.value?.classList.toggle('vehicles-compact', cellPx < COMPACT_BELOW_PX_PER_KM)
    }

    const updateCursor = (e) => {
        if (!dims) return
        const { w, h, maxZ } = dims
        const pt = map.value.project(e.latlng, maxZ)
        const px = Math.round(pt.x)
        const py = Math.round(pt.y)

        if (px < 0 || py < 0 || px > w || py > h) {
            highlight?.hide(map.value)
            onCursor(EMPTY_CURSOR)
            return
        }

        const cells = currentMap.value.cells
        const col = Math.min(cells.x - 1, Math.floor(px / (w / cells.x)))
        const row = Math.min(cells.y - 1, Math.floor(py / (h / cells.y)))

        if (gridVisible.value) highlight?.show(map.value, col, row)
        else highlight?.hide(map.value)

        onCursor({ visible: true, px, py, cell: cellName(col, row), col, row })
    }

    onMounted(async () => {
        map.value = L.map(container.value, MAP_OPTIONS)

        map.value.on('mousemove', updateCursor)
        map.value.on('mouseout', () => {
            highlight?.hide(map.value)
            onCursor(EMPTY_CURSOR)
        })
        map.value.on('resize', applyMinZoom)
        map.value.on('move zoom resize viewreset', updateAxes)
        map.value.on('zoomanim', (e) => {
            liveZoom = { center: e.center, zoom: e.zoom }
            updateAxes()
        })
        map.value.on('smoothzoom', (e) => {
            liveZoom = { scale: e.scale, origin: e.origin }
            updateAxes()
        })
        map.value.on('zoomend smoothzoomend', () => {
            liveZoom = null
            updateAxes()
            updateDensity()
        })
        map.value.on('click', (e) => {
            if (!dims || !onMapClick) return
            const pt = map.value.project(e.latlng, dims.maxZ)
            const px = Math.round(pt.x)
            const py = Math.round(pt.y)
            if (px < 0 || py < 0 || px > dims.w || py > dims.h) return
            onMapClick({ x: px, y: py })
        })

        await showMap(currentMap.value)
    })

    onBeforeUnmount(() => {
        map.value?.remove()
        map.value = null
    })

    watch(currentMap, async (next, prev) => {
        if (!map.value || (prev && next.id === prev.id)) return
        await showMap(next)
    })

    watch(gridVisible, (visible) => {
        if (!gridLayer || !map.value) return
        visible ? gridLayer.addTo(map.value) : map.value.removeLayer(gridLayer)
        if (!visible) highlight?.hide(map.value)
    })

    watch(secretsVisible, (visible) => {
        if (!secretsLayer || !map.value) return
        visible ? secretsLayer.addTo(map.value) : map.value.removeLayer(secretsLayer)
    })

    if (vehiclesVisible) {
        watch(vehiclesVisible, (visible) => {
            if (!map.value || !dims) return
            if (visible) showVehicles(currentMap.value.id, (px, py) => map.value.unproject([px, py], dims.maxZ))
            else if (vehiclesLayer) map.value.removeLayer(vehiclesLayer)
        })
    }

    return { map, axes }
}
