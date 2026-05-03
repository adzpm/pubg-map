import {onMounted, onBeforeUnmount, watch, shallowRef} from 'vue'
import L from 'leaflet'
import {ZOOM_HEADROOM, TILE_SIZE} from '@/config'
import {computeMaxNativeZoom, fetchTileInfo, tileUrlTemplate} from '@/lib/tiles'
import {buildGridLayer, createCellHighlight} from '@/lib/grid'
import {buildSecretRoomsLayer} from '@/lib/secrets'
import {attachSmoothZoom} from '@/lib/smooth-zoom'

const MAP_OPTIONS = {
    crs: L.CRS.Simple,
    zoomSnap: 0,
    zoomDelta: 0.5,
    attributionControl: false,
    scrollWheelZoom: false,
    zoomControl: false,
}

const EMPTY_CURSOR = {visible: false, px: 0, py: 0, cell: ''}

export const useLeafletMap = (container, {currentMap, gridVisible, secretsVisible}, onCursor) => {
    const map = shallowRef(null)

    let baseLayer = null
    let gridLayer = null
    let secretsLayer = null
    let highlight = null
    let dims = null
    let mapBounds = null
    let detachZoom = null

    const applyMinZoom = () => {
        if (!map.value || !mapBounds) return
        const minZoom = map.value.getBoundsZoom(mapBounds, true)
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

        const {width: w, height: h} = await fetchTileInfo(def.id)
        const maxNativeZoom = computeMaxNativeZoom(w, h)
        const maxZoom = maxNativeZoom + ZOOM_HEADROOM
        const toLL = (px, py) => map.value.unproject([px, py], maxNativeZoom)
        const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0))

        dims = {w, h, maxZ: maxNativeZoom}
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

        const minZoom = map.value.getBoundsZoom(bounds, true)
        map.value.setMinZoom(minZoom)
        map.value.setView(bounds.getCenter(), minZoom, {animate: false})
    }

    const updateCursor = (e) => {
        if (!dims) return
        const {w, h, maxZ} = dims
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

        L.control.zoom({position: 'bottomleft'}).addTo(map.value)

        detachZoom = attachSmoothZoom(map.value)

        map.value.on('mousemove', updateCursor)
        map.value.on('mouseout', () => {
            highlight?.hide(map.value)
            onCursor(EMPTY_CURSOR)
        })
        map.value.on('resize', applyMinZoom)

        await showMap(currentMap.value)
    })

    onBeforeUnmount(() => {
        detachZoom?.()
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

    return {map}
}
