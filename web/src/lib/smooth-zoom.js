import L from 'leaflet'
import {PINCH_SETTLE_MS, PINCH_SENSITIVITY} from '@/config'

export const attachSmoothZoom = (map) => {
    const container = map.getContainer()
    const pane = map.getPane('mapPane')

    let active = false
    let scale = 1
    let baseZoom = 0
    let originX = 0
    let originY = 0
    let timer = null

    const apply = () => {
        const pos = L.DomUtil.getPosition(pane)
        pane.style.transformOrigin = `${originX - pos.x}px ${originY - pos.y}px`
        pane.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${scale})`
    }

    const settle = () => {
        if (!active) return
        active = false
        const target = Math.max(
            map.getMinZoom(),
            Math.min(map.getMaxZoom(), baseZoom + Math.log2(scale)),
        )
        pane.style.transformOrigin = ''
        L.DomUtil.setPosition(pane, L.DomUtil.getPosition(pane))
        map.setZoomAround(L.point(originX, originY), target, {animate: false})
        scale = 1
    }

    const onWheel = (e) => {
        e.preventDefault()
        const r = container.getBoundingClientRect()
        originX = e.clientX - r.left
        originY = e.clientY - r.top

        if (!active) {
            active = true
            scale = 1
            baseZoom = map.getZoom()
        }

        scale *= Math.exp(-e.deltaY * PINCH_SENSITIVITY)
        const minS = Math.pow(2, map.getMinZoom() - baseZoom)
        const maxS = Math.pow(2, map.getMaxZoom() - baseZoom)
        scale = Math.max(minS, Math.min(maxS, scale))

        apply()
        clearTimeout(timer)
        timer = setTimeout(settle, PINCH_SETTLE_MS)
    }

    container.addEventListener('wheel', onWheel, {passive: false})

    return () => {
        clearTimeout(timer)
        container.removeEventListener('wheel', onWheel)
    }
}
