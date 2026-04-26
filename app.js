const {createApp, ref, watch, onMounted, onBeforeUnmount} = Vue;

const TILE_SIZE = 256;
const ZOOM_HEADROOM = 8;
const PINCH_SETTLE_MS = 140;
const PINCH_SENSITIVITY = 0.005;
const SUBDIV = 10;

const MAPS = [
    {id: 'erangel', name: 'Erangel', cells: {x: 8, y: 8}},
    {id: 'taego', name: 'Taego', cells: {x: 8, y: 8}},
    {id: 'miramar', name: 'Miramar', cells: {x: 8, y: 8}},
    {id: 'deston', name: 'Deston', cells: {x: 8, y: 8}},
    {id: 'rondo', name: 'Rondo', cells: {x: 8, y: 8}},
    {id: 'sanhok', name: 'Sanhok', cells: {x: 4, y: 4}},
    {id: 'paramo', name: 'Paramo', cells: {x: 3, y: 3}},
    {id: 'karakin', name: 'Karakin', cells: {x: 2, y: 2}},
];

const SECRET_ROOMS = {
    erangel: [
        {x: 1379, y: 1815, name: '...'},
    ],
    taego: [],
    miramar: [],
    deston: [],
    rondo: [],
    sanhok: [],
    paramo: [],
    karakin: [],
};

const computeMaxNativeZoom = (w, h) => Math.ceil(Math.log2(Math.max(w, h) / TILE_SIZE));

const fetchTileInfo = async (id) => {
    const r = await fetch(`assets/tiles/${id}/info.json`, {cache: 'force-cache'});
    if (!r.ok) throw new Error(`Tiles for "${id}" not found. Run scripts/build-tiles.sh first.`);
    return r.json();
};

const buildGridLayer = (cells, w, h, toLL) => {
    const layer = L.layerGroup();
    const cw = w / cells.x;
    const ch = h / cells.y;

    const subStyle = {color: '#fff', weight: 1, opacity: 0.15, interactive: false, className: 'pubg-grid-subline'};
    const mainStyle = {color: '#fff', weight: 1, opacity: 0.30, interactive: false, className: 'pubg-grid-line'};

    for (let i = 0; i < cells.x; i++) {
        for (let k = 1; k < SUBDIV; k++) {
            const x = i * cw + (k * cw) / SUBDIV;
            L.polyline([toLL(x, 0), toLL(x, h)], subStyle).addTo(layer);
        }
    }
    for (let j = 0; j < cells.y; j++) {
        for (let k = 1; k < SUBDIV; k++) {
            const y = j * ch + (k * ch) / SUBDIV;
            L.polyline([toLL(0, y), toLL(w, y)], subStyle).addTo(layer);
        }
    }
    for (let i = 0; i <= cells.x; i++) {
        L.polyline([toLL(i * cw, 0), toLL(i * cw, h)], mainStyle).addTo(layer);
    }
    for (let j = 0; j <= cells.y; j++) {
        L.polyline([toLL(0, j * ch), toLL(w, j * ch)], mainStyle).addTo(layer);
    }

    for (let i = 0; i < cells.x; i++) {
        L.marker(toLL(i * cw + cw / 2, 0), {
            interactive: false,
            icon: L.divIcon({
                className: 'pubg-grid-label pubg-grid-label-col',
                html: String.fromCharCode(65 + i),
                iconSize: [cw, 0],
                iconAnchor: [cw / 2, 0],
            }),
        }).addTo(layer);
    }
    for (let j = 0; j < cells.y; j++) {
        L.marker(toLL(0, j * ch + ch / 2), {
            interactive: false,
            icon: L.divIcon({
                className: 'pubg-grid-label pubg-grid-label-row',
                html: String(j + 1),
                iconSize: [0, ch],
                iconAnchor: [0, ch / 2],
            }),
        }).addTo(layer);
    }

    return layer;
};

const buildSecretRoomsLayer = (mapId, toLL) => {
    const layer = L.layerGroup();
    const icon = L.divIcon({
        className: 'secret-room-marker',
        html: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
    for (const p of SECRET_ROOMS[mapId] || []) {
        const marker = L.marker(toLL(p.x, p.y), {icon, riseOnHover: true});
        if (p.name) marker.bindTooltip(p.name, {direction: 'top', offset: [0, -12]});
        marker.addTo(layer);
    }
    return layer;
};

const attachSmoothZoom = (map) => {
    const container = map.getContainer();
    const pane = map.getPane('mapPane');

    let active = false;
    let scale = 1;
    let baseZoom = 0;
    let originX = 0;
    let originY = 0;
    let timer = null;

    const apply = () => {
        const pos = L.DomUtil.getPosition(pane);
        pane.style.transformOrigin = `${originX - pos.x}px ${originY - pos.y}px`;
        pane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`;
    };

    const settle = () => {
        if (!active) return;
        active = false;
        const target = Math.max(
            map.getMinZoom(),
            Math.min(map.getMaxZoom(), baseZoom + Math.log2(scale)),
        );
        pane.style.transformOrigin = '';
        L.DomUtil.setPosition(pane, L.DomUtil.getPosition(pane));
        map.setZoomAround(L.point(originX, originY), target, {animate: false});
        scale = 1;
    };

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const r = container.getBoundingClientRect();
        originX = e.clientX - r.left;
        originY = e.clientY - r.top;

        if (!active) {
            active = true;
            scale = 1;
            baseZoom = map.getZoom();
        }

        scale *= Math.exp(-e.deltaY * PINCH_SENSITIVITY);
        const minS = Math.pow(2, map.getMinZoom() - baseZoom);
        const maxS = Math.pow(2, map.getMaxZoom() - baseZoom);
        scale = Math.max(minS, Math.min(maxS, scale));

        apply();
        clearTimeout(timer);
        timer = setTimeout(settle, PINCH_SETTLE_MS);
    }, {passive: false});
};

createApp({
    setup() {
        const currentMap = ref(MAPS[0]);
        const gridVisible = ref(true);
        const secretsVisible = ref(true);
        const cursor = ref({visible: false, px: 0, py: 0, cell: ''});

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
            if (gridVisible.value) gridLayer.addTo(map);

            secretsLayer = buildSecretRoomsLayer(def.id, toLL);
            if (secretsVisible.value) secretsLayer.addTo(map);

            map.setMaxZoom(maxZoom);
            map.setMaxBounds(bounds);
            map.fitBounds(bounds);
        };

        const selectMap = async (m) => {
            if (m.id === currentMap.value.id) return;
            currentMap.value = m;
            await showMap(m);
        };

        const updateCursor = (e) => {
            if (!dims) return;
            const {w, h, maxZ} = dims;
            const pt = map.project(e.latlng, maxZ);
            const px = Math.round(pt.x);
            const py = Math.round(pt.y);
            if (px < 0 || py < 0 || px > w || py > h) {
                if (cursor.value.visible) cursor.value.visible = false;
                return;
            }
            const cells = currentMap.value.cells;
            const col = Math.min(cells.x - 1, Math.floor(px / (w / cells.x)));
            const row = Math.min(cells.y - 1, Math.floor(py / (h / cells.y)));
            cursor.value = {
                visible: true,
                px, py,
                cell: `${String.fromCharCode(65 + col)}${row + 1}`,
            };
        };

        watch(gridVisible, (v) => {
            if (!gridLayer) return;
            v ? gridLayer.addTo(map) : map.removeLayer(gridLayer);
        });

        watch(secretsVisible, (v) => {
            if (!secretsLayer) return;
            v ? secretsLayer.addTo(map) : map.removeLayer(secretsLayer);
        });

        onMounted(async () => {
            map = L.map('map', {
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
            map.on('mouseout', () => {
                cursor.value.visible = false;
            });

            await showMap(currentMap.value);
        });

        onBeforeUnmount(() => map?.remove());

        return {
            maps: MAPS,
            currentMap,
            gridVisible,
            secretsVisible,
            cursor,
            selectMap,
        };
    },
}).mount('#app');
