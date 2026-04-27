import {onMounted, onBeforeUnmount, watch, shallowRef} from 'vue'
import L from 'leaflet'
import {ZOOM_HEADROOM, TILE_SIZE} from '@/config'
import {computeMaxNativeZoom, fetchTileInfo, tileUrlTemplate} from '@/lib/tiles'
import {buildGridLayer} from '@/lib/grid'
import {buildSecretRoomsLayer} from '@/lib/secrets'
import {attachSmoothZoom} from '@/lib/smooth-zoom'

const MAP_OPTIONS = {
    crs: L.CRS.Simple,
    minZoom: -5,
    maxZoom: 8,
    zoomSnap: 0,
    zoomDelta: 0.5,
    attributionControl: false,
    scrollWheelZoom: false,
}

const EMPTY_CURSOR = {visible: false, px: 0, py: 0, cell: ''}

export const useLeafletMap = (container, {currentMap, gridVisible, secretsVisible}, onCursor) => {
    const map = shallowRef(null)

    let baseLayer = null
    let gridLayer = null
    let secretsLayer = null
    let dims = null
    let detachZoom = null

    const cleanupLayers = () => {
        for (const layer of [baseLayer, gridLayer, secretsLayer]) {
            if (layer) map.value.removeLayer(layer)
        }
        baseLayer = gridLayer = secretsLayer = null
    }

    const showMap = async (def) => {
        cleanupLayers()

        const {width: w, height: h} = await fetchTileInfo(def.id)
        const maxNativeZoom = computeMaxNativeZoom(w, h)
        const maxZoom = maxNativeZoom + ZOOM_HEADROOM
        const toLL = (px, py) => map.value.unproject([px, py], maxNativeZoom)
        const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0))

        dims = {w, h, maxZ: maxNativeZoom}

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

        map.value.setMaxZoom(maxZoom)
        map.value.setMaxBounds(bounds)
        map.value.fitBounds(bounds)
    }

    const updateCursor = (e) => {
        if (!dims) return
        const {w, h, maxZ} = dims
        const pt = map.value.project(e.latlng, maxZ)
        const px = Math.round(pt.x)
        const py = Math.round(pt.y)

        if (px < 0 || py < 0 || px > w || py > h) {
            onCursor(EMPTY_CURSOR)
            return
        }

        const cells = currentMap.value.cells
        const col = Math.min(cells.x - 1, Math.floor(px / (w / cells.x)))
        const row = Math.min(cells.y - 1, Math.floor(py / (h / cells.y)))

        onCursor({
            visible: true,
            px,
            py,
            cell: `${String.fromCharCode(65 + col)}${row + 1}`,
        })
    }

    onMounted(async () => {
        map.value = L.map(container.value, MAP_OPTIONS)

        detachZoom = attachSmoothZoom(map.value)

        map.value.on('mousemove', updateCursor)
        map.value.on('mouseout', () => onCursor(EMPTY_CURSOR))

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
    })

    watch(secretsVisible, (visible) => {
        if (!secretsLayer || !map.value) return
        visible ? secretsLayer.addTo(map.value) : map.value.removeLayer(secretsLayer)
    })

    return {map}
}
