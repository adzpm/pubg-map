import L from 'leaflet'

const SUBDIV = 10

const SUB_STYLE = {
    color: '#fff',
    weight: 1,
    opacity: 0.1,
    interactive: false,
    className: 'pubg-grid-subline',
}

const MAIN_STYLE = {
    color: '#fff',
    weight: 1,
    opacity: 0.3,
    interactive: false,
    className: 'pubg-grid-line',
}

const HIGHLIGHT_STYLE = {
    color: '#fff',
    weight: 0,
    fillColor: '#fff',
    fillOpacity: 0.05,
    interactive: false,
}

const cellSize = (cells, w, h) => ({cw: w / cells.x, ch: h / cells.y})

export const buildGridLayer = (cells, w, h, toLL) => {
    const layer = L.layerGroup()
    const {cw, ch} = cellSize(cells, w, h)

    for (let i = 0; i < cells.x; i++) {
        for (let k = 1; k < SUBDIV; k++) {
            const x = i * cw + (k * cw) / SUBDIV
            L.polyline([toLL(x, 0), toLL(x, h)], SUB_STYLE).addTo(layer)
        }
    }

    for (let j = 0; j < cells.y; j++) {
        for (let k = 1; k < SUBDIV; k++) {
            const y = j * ch + (k * ch) / SUBDIV
            L.polyline([toLL(0, y), toLL(w, y)], SUB_STYLE).addTo(layer)
        }
    }

    for (let i = 0; i <= cells.x; i++) {
        L.polyline([toLL(i * cw, 0), toLL(i * cw, h)], MAIN_STYLE).addTo(layer)
    }

    for (let j = 0; j <= cells.y; j++) {
        L.polyline([toLL(0, j * ch), toLL(w, j * ch)], MAIN_STYLE).addTo(layer)
    }

    for (let i = 0; i < cells.x; i++) {
        L.marker(toLL(i * cw + cw / 2, 0), {
            interactive: false,
            icon: L.divIcon({
                className: 'pubg-grid-label',
                html: String.fromCharCode(65 + i),
                iconSize: [cw, 0],
                iconAnchor: [cw / 2, 0],
            }),
        }).addTo(layer)
    }

    for (let j = 0; j < cells.y; j++) {
        L.marker(toLL(0, j * ch + ch / 2), {
            interactive: false,
            icon: L.divIcon({
                className: 'pubg-grid-label',
                html: String(j + 1),
                iconSize: [0, ch],
                iconAnchor: [0, ch / 2],
            }),
        }).addTo(layer)
    }

    return layer
}

export const createCellHighlight = (cells, w, h, toLL) => {
    const {cw, ch} = cellSize(cells, w, h)

    const cellBounds = (col, row) => L.latLngBounds(
        toLL(col * cw, (row + 1) * ch),
        toLL((col + 1) * cw, row * ch),
    )

    let rectangle = null
    let current = null

    return {
        show(map, col, row) {
            if (current && current.col === col && current.row === row) return
            current = {col, row}
            const bounds = cellBounds(col, row)
            if (rectangle) {
                rectangle.setBounds(bounds)
            } else {
                rectangle = L.rectangle(bounds, HIGHLIGHT_STYLE).addTo(map)
            }
        },
        hide(map) {
            if (!rectangle) return
            map.removeLayer(rectangle)
            rectangle = null
            current = null
        },
    }
}
