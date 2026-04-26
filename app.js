const {createApp, ref, watch, onMounted, onBeforeUnmount} = Vue;

const MAPS = [
    {id: 'erangel', name: 'Erangel', cells: {x: 8, y: 8}, file: 'Erangel_Main_High_Res1.png'},
    {id: 'miramar', name: 'Miramar', cells: {x: 8, y: 8}, file: 'Miramar_Main_High_Res2.png'},
    {id: 'sanhok', name: 'Sanhok', cells: {x: 4, y: 4}, file: 'Sanhok_Main_High_Res3.png'},
    {id: 'deston', name: 'Deston', cells: {x: 8, y: 8}, file: 'Deston_Main_High_Res4.png'},
    {id: 'rondo', name: 'Rondo', cells: {x: 8, y: 8}, file: 'Rondo_Main_High_Res5.png'},
    {id: 'karakin', name: 'Karakin', cells: {x: 2, y: 2}, file: 'Karakin_Main_High_Res2.png'},
    {id: 'paramo', name: 'Paramo', cells: {x: 3, y: 3}, file: 'Paramo_Main_High_Res1.png'},
].map(m => ({...m, image: `assets/maps/${m.file}`}));

const computeMaxZoom = (w, h) => Math.ceil(Math.log2(Math.max(w, h) / 256));

const SECRET_ROOMS = {
    erangel: [
        {x: 1379, y: 1815, name: '...'},
    ],
    miramar: [
        {x: 0, y: 0, name: '...'},
    ],
    sanhok: [
        {x: 0, y: 0, name: '...'},
    ],
    deston: [
        {x: 0, y: 0, name: '...'},
    ],
    rondo: [
        {x: 0, y: 0, name: '...'},
    ],
    karakin: [
        {x: 0, y: 0, name: '...'},
    ],
    paramo: [
        {x: 0, y: 0, name: '...'},
    ],
};

const buildSecretRooms = (def, toLL) => {
    const points = SECRET_ROOMS[def.id] || [];
    const layer = L.layerGroup();
    const icon = L.divIcon({
        className: 'secret-room-marker',
        html: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
    for (const p of points) {
        const marker = L.marker(toLL(p.x, p.y), {icon, riseOnHover: true});
        if (p.name) marker.bindTooltip(p.name, {direction: 'top', offset: [0, -12]});
        marker.addTo(layer);
    }
    return layer;
};

const buildGrid = (def, w, h, toLL) => {
    const cells = def.cells;
    const layer = L.layerGroup();
    const cw = w / cells.x;
    const ch = h / cells.y;

    const SUBDIV = 10;
    const subLineStyle = {
        color: '#ffffff',
        weight: 1,
        opacity: 0.15,
        interactive: false,
        className: 'pubg-grid-subline',
    };
    const lineStyle = {
        color: '#ffffff',
        weight: 1,
        opacity: 0.30,
        interactive: false,
        className: 'pubg-grid-line',
    };

    for (let i = 0; i < cells.x; i++) {
        for (let k = 1; k < SUBDIV; k++) {
            const x = i * cw + (k * cw) / SUBDIV;
            L.polyline([toLL(x, 0), toLL(x, h)], subLineStyle).addTo(layer);
        }
    }

    for (let j = 0; j < cells.y; j++) {
        for (let k = 1; k < SUBDIV; k++) {
            const y = j * ch + (k * ch) / SUBDIV;
            L.polyline([toLL(0, y), toLL(w, y)], subLineStyle).addTo(layer);
        }
    }

    for (let i = 0; i <= cells.x; i++) {
        const x = i * cw;
        L.polyline([toLL(x, 0), toLL(x, h)], lineStyle).addTo(layer);
    }

    for (let j = 0; j <= cells.y; j++) {
        const y = j * ch;
        L.polyline([toLL(0, y), toLL(w, y)], lineStyle).addTo(layer);
    }

    const letterIcon = (text) => L.divIcon({
        className: 'pubg-grid-label pubg-grid-label-col',
        html: text,
        iconSize: [cw, 0],
        iconAnchor: [cw / 2, 0],
    });

    const numberIcon = (text) => L.divIcon({
        className: 'pubg-grid-label pubg-grid-label-row',
        html: text,
        iconSize: [0, ch],
        iconAnchor: [0, ch / 2],
    });

    for (let i = 0; i < cells.x; i++) {
        const letter = String.fromCharCode(65 + i);
        L.marker(toLL(i * cw + cw / 2, 0), {icon: letterIcon(letter), interactive: false}).addTo(layer);
    }

    for (let j = 0; j < cells.y; j++) {
        const number = String(j + 1);
        L.marker(toLL(0, j * ch + ch / 2), {icon: numberIcon(number), interactive: false}).addTo(layer);
    }

    return layer;
};

createApp({
    setup() {
        const currentMap = ref(MAPS[0]);
        const gridVisible = ref(true);
        const secretsVisible = ref(false);
        const cursor = ref({visible: false, px: 0, py: 0, cell: ''});
        let map = null;
        let overlay = null;
        let gridLayer = null;
        let secretsLayer = null;
        let dims = {w: 0, h: 0, maxZ: 0};

        const fetchInfo = async (id) => {
            try {
                const r = await fetch(`assets/tiles/${id}/info.json`, {cache: 'force-cache'});
                if (!r.ok) return null;
                return await r.json();
            } catch {
                return null;
            }
        };

        const loadImageSize = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({w: img.naturalWidth, h: img.naturalHeight});
            img.onerror = reject;
            img.src = src;
        });

        const showMap = async (def) => {
            if (overlay) {
                map.removeLayer(overlay);
                overlay = null;
            }
            if (gridLayer) {
                map.removeLayer(gridLayer);
                gridLayer = null;
            }
            if (secretsLayer) {
                map.removeLayer(secretsLayer);
                secretsLayer = null;
            }

            const info = await fetchInfo(def.id);
            let w, h, useTiles;
            if (info) {
                w = info.width;
                h = info.height;
                useTiles = true;
            } else {
                const sz = await loadImageSize(def.image);
                w = sz.w;
                h = sz.h;
                useTiles = false;
            }

            const maxZ = computeMaxZoom(w, h);
            const toLL = (px, py) => map.unproject([px, py], maxZ);
            const bounds = L.latLngBounds(toLL(0, h), toLL(w, 0));
            dims = {w, h, maxZ};

            const maxMapZoom = maxZ + 8;

            if (useTiles) {
                overlay = L.tileLayer(`assets/tiles/${def.id}/{z}/{y}/{x}.webp`, {
                    tileSize: 256,
                    minNativeZoom: 0,
                    maxNativeZoom: maxZ,
                    maxZoom: maxMapZoom,
                    bounds,
                    noWrap: true,
                    keepBuffer: 8,
                }).addTo(map);
            } else {
                overlay = L.imageOverlay(def.image, bounds).addTo(map);
            }

            gridLayer = buildGrid(def, w, h, toLL);
            if (gridVisible.value) gridLayer.addTo(map);

            secretsLayer = buildSecretRooms(def, toLL);
            if (secretsVisible.value) secretsLayer.addTo(map);

            map.setMaxZoom(maxMapZoom);
            map.setMaxBounds(bounds);
            map.fitBounds(bounds);
        };

        const selectMap = async (m) => {
            if (m.id === currentMap.value.id) return;
            currentMap.value = m;
            await showMap(m);
        };

        watch(gridVisible, (v) => {
            if (!map || !gridLayer) return;
            if (v) gridLayer.addTo(map);
            else map.removeLayer(gridLayer);
        });

        watch(secretsVisible, (v) => {
            if (!map || !secretsLayer) return;
            if (v) secretsLayer.addTo(map);
            else map.removeLayer(secretsLayer);
        });

        onMounted(async () => {
            map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: -5,
                maxZoom: 8,
                zoomSnap: 0,
                zoomDelta: 0.5,
                zoomAnimation: true,
                attributionControl: false,
                zoomControl: true,
                scrollWheelZoom: false,
            });

            const container = map.getContainer();
            const mapPane = map.getPane('mapPane');

            let pinching = false;
            let pinchScale = 1;
            let pinchBaseZoom = 0;
            let pinchOriginX = 0;
            let pinchOriginY = 0;
            let settleTimer = null;

            const applyVisualScale = () => {
                const pos = mapPane._leaflet_pos || L.point(0, 0);
                mapPane.style.transformOrigin = `${pinchOriginX - pos.x}px ${pinchOriginY - pos.y}px`;
                mapPane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${pinchScale})`;
            };

            const settle = () => {
                if (!pinching) return;
                pinching = false;
                const newZoom = Math.max(
                    map.getMinZoom(),
                    Math.min(map.getMaxZoom(), pinchBaseZoom + Math.log2(pinchScale)),
                );
                mapPane.style.transformOrigin = '';
                const pos = mapPane._leaflet_pos || L.point(0, 0);
                L.DomUtil.setPosition(mapPane, pos);
                map.setZoomAround(L.point(pinchOriginX, pinchOriginY), newZoom, {animate: false});
                pinchScale = 1;
            };

            container.addEventListener('wheel', (e) => {
                e.preventDefault();
                const r = container.getBoundingClientRect();
                pinchOriginX = e.clientX - r.left;
                pinchOriginY = e.clientY - r.top;

                if (!pinching) {
                    pinching = true;
                    pinchScale = 1;
                    pinchBaseZoom = map.getZoom();
                }

                pinchScale *= Math.exp(-e.deltaY * 0.005);

                const minS = Math.pow(2, map.getMinZoom() - pinchBaseZoom);
                const maxS = Math.pow(2, map.getMaxZoom() - pinchBaseZoom);
                pinchScale = Math.max(minS, Math.min(maxS, pinchScale));

                applyVisualScale();

                clearTimeout(settleTimer);
                settleTimer = setTimeout(settle, 140);
            }, {passive: false});

            map.on('mousemove', (e) => {
                const {w, h, maxZ} = dims;
                if (!w) return;
                const pt = map.project(e.latlng, maxZ);
                const px = Math.round(pt.x);
                const py = Math.round(pt.y);
                if (px < 0 || py < 0 || px > w || py > h) {
                    if (cursor.value.visible) cursor.value = {...cursor.value, visible: false};
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
            });

            map.on('mouseout', () => {
                cursor.value = {...cursor.value, visible: false};
            });

            await showMap(currentMap.value);
        });

        onBeforeUnmount(() => {
            if (map) map.remove();
        });

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
