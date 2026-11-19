import L from 'leaflet'

const SUBDIV = 10

// sand-coloured lines from the field-case palette (--sand in main.css)
const SUB_STYLE = {
    color: '#e2d6b4',
    weight: 1,
    opacity: 0.1,
    interactive: false,
    className: 'pubg-grid-subline',
}

const MAIN_STYLE = {
    color: '#e2d6b4',
    weight: 1,
    opacity: 0.4,
    interactive: false,
    className: 'pubg-grid-line',
}

// signal orange (--signal), kept faint: the edge labels carry the strong highlight
const HIGHLIGHT_STYLE = {
    color: '#ff7438',
    weight: 0,
    fillColor: '#ff7438',
    fillOpacity: 0.08,
    interactive: false,
}

const cellSize = (cells, w, h) => ({ cw: w / cells.x, ch: h / cells.y })

/** Column letter for a zero-based column index: 0 -> A. */
export const columnName = (col) => String.fromCharCode(65 + col)

/** Grid cell name for zero-based col/row: (2, 3) -> C4. */
export const cellName = (col, row) => `${columnName(col)}${row + 1}`

/** Builds the grid line overlay; w/h are source-image pixels, toLL projects them at maxNativeZoom. */
export const buildGridLayer = (cells, w, h, toLL) => {
    const layer = L.layerGroup()
    const { cw, ch } = cellSize(cells, w, h)

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

    return layer
}

/**
 * Screen extents of every column and row, for the labels pinned to the screen edges.
 * project(x, y) maps source-image pixels to container pixels; a/b are the start/end edge.
 */
export const gridAxes = (cells, w, h, project) => {
    const { cw, ch } = cellSize(cells, w, h)
    const cols = Array.from({ length: cells.x }, (_, i) => ({
        index: i,
        label: columnName(i),
        a: project(i * cw, 0).x,
        b: project((i + 1) * cw, 0).x,
    }))
    const rows = Array.from({ length: cells.y }, (_, j) => ({
        index: j,
        label: String(j + 1),
        a: project(0, j * ch).y,
        b: project(0, (j + 1) * ch).y,
    }))
    return { cols, rows }
}

/** Creates a show(map, col, row)/hide(map) controller for the hovered-cell rectangle; same conventions as buildGridLayer. */
export const createCellHighlight = (cells, w, h, toLL) => {
    const { cw, ch } = cellSize(cells, w, h)

    const cellBounds = (col, row) => L.latLngBounds(toLL(col * cw, (row + 1) * ch), toLL((col + 1) * cw, row * ch))

    let rectangle = null
    let current = null

    return {
        show(map, col, row) {
            if (current && current.col === col && current.row === row) return
            current = { col, row }
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
