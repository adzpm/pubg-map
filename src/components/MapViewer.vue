<script setup>
import {ref, watch, onMounted, onBeforeUnmount} from 'vue';
import L from 'leaflet';
import {TILE_SIZE, ZOOM_HEADROOM} from '../constants.js';
import {computeMaxNativeZoom, fetchTileInfo} from '../map/tiles.js';
import {buildGridLayer} from '../map/grid.js';
import {buildSecretRoomsLayer} from '../map/secrets.js';
import {attachSmoothZoom} from '../map/zoom.js';

const props = defineProps({
    currentMap: {type: Object, required: true},
    gridVisible: {type: Boolean, default: true},
    secretsVisible: {type: Boolean, default: true},
});

const emit = defineEmits(['cursor']);

const mapEl = ref(null);

let map = null;
let baseLayer = null;
let gridLayer = null;
let secretsLayer = null;
let dims = null;

const cleanupLayers = () => {
    [baseLayer, gridLayer, secretsLayer].forEach(l => l && map.removeLayer(l));
    baseLayer = gridLayer = secretsLayer = null;
};

const showMap = async (def) => {
    cleanupLayers();

    const {width: w, height: h} = await fetchTileInfo(def.id);
    const maxNativeZoom = computeMaxNativeZoom(w, h);
    const maxZoom = maxNativeZoom + ZOOM_HEADROOM;
    const toLL = (px, py) => map.unproject([px, py], maxNativeZoom);
    const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0));

    dims = {w, h, maxZ: maxNativeZoom};

    baseLayer = L.tileLayer(`assets/tiles/${def.id}/{z}/{y}/{x}.webp`, {
        tileSize: TILE_SIZE,
        minNativeZoom: 0,
        maxNativeZoom,
        maxZoom,
        bounds,
        noWrap: true,
        keepBuffer: 8,
    }).addTo(map);

    gridLayer = buildGridLayer(def.cells, w, h, toLL);
    if (props.gridVisible) gridLayer.addTo(map);

    secretsLayer = buildSecretRoomsLayer(def.id, toLL);
    if (props.secretsVisible) secretsLayer.addTo(map);

    map.setMaxZoom(maxZoom);
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
};

const updateCursor = (e) => {
    if (!dims) return;
    const {w, h, maxZ} = dims;
    const pt = map.project(e.latlng, maxZ);
    const px = Math.round(pt.x);
    const py = Math.round(pt.y);
    if (px < 0 || py < 0 || px > w || py > h) {
        emit('cursor', {visible: false, px: 0, py: 0, cell: ''});
        return;
    }
    const cells = props.currentMap.cells;
    const col = Math.min(cells.x - 1, Math.floor(px / (w / cells.x)));
    const row = Math.min(cells.y - 1, Math.floor(py / (h / cells.y)));
    emit('cursor', {
        visible: true,
        px, py,
        cell: `${String.fromCharCode(65 + col)}${row + 1}`,
    });
};

watch(() => props.currentMap, async (m, prev) => {
    if (prev && m.id === prev.id) return;
    await showMap(m);
});

watch(() => props.gridVisible, (v) => {
    if (!gridLayer) return;
    v ? gridLayer.addTo(map) : map.removeLayer(gridLayer);
});

watch(() => props.secretsVisible, (v) => {
    if (!secretsLayer) return;
    v ? secretsLayer.addTo(map) : map.removeLayer(secretsLayer);
});

onMounted(async () => {
    map = L.map(mapEl.value, {
        crs: L.CRS.Simple,
        minZoom: -5,
        maxZoom: 8,
        zoomSnap: 0,
        zoomDelta: 0.5,
        attributionControl: false,
        scrollWheelZoom: false,
    });

    attachSmoothZoom(map);

    map.on('mousemove', updateCursor);
    map.on('mouseout', () => emit('cursor', {visible: false, px: 0, py: 0, cell: ''}));

    await showMap(props.currentMap);
});

onBeforeUnmount(() => map?.remove());
</script>

<template>
    <div ref="mapEl" class="map-viewport"></div>
</template>
