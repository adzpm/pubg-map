import L from 'leaflet';
import {SUBDIV} from '../constants.js';

export const buildGridLayer = (cells, w, h, toLL) => {
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
