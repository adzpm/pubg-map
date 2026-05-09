import L from 'leaflet'

L.Map.mergeOptions({
    smoothZoom: false,
    smoothZoomSensitivity: 0.005,
    smoothZoomSettleMs: 140,
})

L.Map.SmoothZoom = L.Handler.extend({
    addHooks: function () {
        L.DomEvent.on(this._map.getContainer(), 'wheel', this._onWheel, this)
    },

    removeHooks: function () {
        L.DomEvent.off(this._map.getContainer(), 'wheel', this._onWheel, this)
        clearTimeout(this._timer)
    },

    _onWheel: function (e) {
        L.DomEvent.preventDefault(e)

        const map = this._map
        const rect = map.getContainer().getBoundingClientRect()
        this._originX = e.clientX - rect.left
        this._originY = e.clientY - rect.top

        if (!this._active) {
            this._active = true
            this._scale = 1
            this._baseZoom = map.getZoom()
        }

        this._scale *= Math.exp(-e.deltaY * map.options.smoothZoomSensitivity)
        const minS = Math.pow(2, map.getMinZoom() - this._baseZoom)
        const maxS = Math.pow(2, map.getMaxZoom() - this._baseZoom)
        this._scale = Math.max(minS, Math.min(maxS, this._scale))

        this._apply()

        clearTimeout(this._timer)
        this._timer = setTimeout(L.Util.bind(this._settle, this), map.options.smoothZoomSettleMs)
    },

    _apply: function () {
        const pane = this._map.getPane('mapPane')
        const pos = L.DomUtil.getPosition(pane)
        pane.style.transformOrigin = `${this._originX - pos.x}px ${this._originY - pos.y}px`
        pane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${this._scale})`
    },

    _settle: function () {
        if (!this._active) return
        this._active = false

        const map = this._map
        const target = Math.max(
            map.getMinZoom(),
            Math.min(map.getMaxZoom(), this._baseZoom + Math.log2(this._scale)),
        )

        const pane = map.getPane('mapPane')
        pane.style.transformOrigin = ''
        L.DomUtil.setPosition(pane, L.DomUtil.getPosition(pane))

        map.setZoomAround(L.point(this._originX, this._originY), target, {animate: false})
        this._scale = 1
    },
})

L.Map.addInitHook('addHandler', 'smoothZoom', L.Map.SmoothZoom)
