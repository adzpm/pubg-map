import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import L from 'leaflet'
import { computeMaxNativeZoom, fetchTileInfo, tileUrlTemplate, TILE_SIZE } from '@/lib/tiles'
import { buildGridLayer, createCellHighlight } from '@/lib/grid'
import { buildSecretRoomsLayer } from '@/lib/secrets'
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

const EMPTY_CURSOR = { visible: false, px: 0, py: 0, cell: '' }

/**
 * Mounts a Leaflet map into `container` and keeps it in sync with the given reactive state.
 * Cursor and click positions are reported in source-image pixels (origin top-left).
 */
export const useLeafletMap = (container, { currentMap, gridVisible, secretsVisible }, onCursor, onMapClick) => {
    const map = shallowRef(null)

    let baseLayer = null
    let gridLayer = null
    let secretsLayer = null
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

    const cleanupLayers = () => {
        if (highlight) highlight.hide(map.value)
        for (const layer of [baseLayer, gridLayer, secretsLayer]) {
            if (layer) map.value.removeLayer(layer)
        }
        baseLayer = gridLayer = secretsLayer = highlight = null
    }

    const showMap = async (def) => {
        cleanupLayers()

        const { width: w, height: h } = await fetchTileInfo(def.id)
        const maxNativeZoom = computeMaxNativeZoom(w, h)
        const maxZoom = maxNativeZoom + ZOOM_HEADROOM
        // toLL: source-image pixels -> LatLng, projected at maxNativeZoom (1 px == 1 CRS unit there)
        const toLL = (px, py) => map.value.unproject([px, py], maxNativeZoom)
        const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0))

        dims = { w, h, maxZ: maxNativeZoom }
        mapBounds = bounds

        baseLayer = L.tileLayer(tileUrlTemplate(def.id), {
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

        highlight = createCellHighlight(def.cells, w, h, toLL)

        map.value.setMaxZoom(maxZoom)
        map.value.setMaxBounds(bounds)

        const { min: minZoom, init: initZoom } = fitZooms()
        map.value.setMinZoom(minZoom)
        map.value.setView(bounds.getCenter(), initZoom, { animate: false })
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

        onCursor({
            visible: true,
            px,
            py,
            cell: `${String.fromCharCode(65 + col)}${row + 1}`,
        })
    }

    onMounted(async () => {
        map.value = L.map(container.value, MAP_OPTIONS)

        map.value.on('mousemove', updateCursor)
        map.value.on('mouseout', () => {
            highlight?.hide(map.value)
            onCursor(EMPTY_CURSOR)
        })
        map.value.on('resize', applyMinZoom)
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

    return { map }
}
