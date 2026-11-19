import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePersistentRef } from '@/composables/usePersistentRef'

/** Gap kept between the window and the screen edge. */
export const MARGIN = 12
/** Within this distance of an edge a dragged window sticks to it. */
export const SNAP = 24
const KEY_STEP = 12
const KEY_STEP_FAST = 48

/**
 * Keeps a w×h window fully inside a vw×vh viewport; with snap, a window within SNAP px of an edge
 * sticks to that edge. Pure, so the drag maths is testable without layout.
 */
export const clampToViewport = ({ x, y }, { w, h }, { vw, vh }, snap = true) => {
    const maxX = Math.max(vw - w - MARGIN, MARGIN)
    const maxY = Math.max(vh - h - MARGIN, MARGIN)
    let nx = Math.min(Math.max(x, MARGIN), maxX)
    let ny = Math.min(Math.max(y, MARGIN), maxY)
    if (snap) {
        if (nx - MARGIN < SNAP) nx = MARGIN
        else if (maxX - nx < SNAP) nx = maxX
        if (ny - MARGIN < SNAP) ny = MARGIN
        else if (maxY - ny < SNAP) ny = maxY
    }
    return { x: nx, y: ny }
}

const validState = (v) => v && Number.isFinite(v.x) && Number.isFinite(v.y) && typeof v.collapsed === 'boolean'

/**
 * A draggable, foldable floating window. Bind the returned handlers to the window's handle;
 * position and folded state persist under 'pubg-map:<key>'.
 */
export const useFloatingWindow = (windowEl, key = 'window') => {
    const saved = usePersistentRef(key, { x: MARGIN, y: MARGIN, collapsed: false })
    if (!validState(saved.value)) saved.value = { x: MARGIN, y: MARGIN, collapsed: false }

    // live position while dragging; written to storage only when the drag ends
    const pos = ref({ x: saved.value.x, y: saved.value.y })
    const collapsed = computed(() => saved.value.collapsed)
    const dragging = ref(false)
    let drag = null

    const size = () => ({ w: windowEl.value?.offsetWidth ?? 0, h: windowEl.value?.offsetHeight ?? 0 })
    const viewport = () => ({ vw: window.innerWidth, vh: window.innerHeight })

    const place = (x, y, snap = true) => {
        pos.value = clampToViewport({ x, y }, size(), viewport(), snap)
    }
    const persist = () => {
        saved.value = { ...saved.value, ...pos.value }
    }

    // folding keeps the corner nearest a screen edge in place, so a window docked bottom-right
    // folds into that corner instead of hanging in mid-air
    const setCollapsed = async (on) => {
        if (on === collapsed.value) return
        const el = windowEl.value
        const before = el?.getBoundingClientRect()
        saved.value = { ...saved.value, collapsed: on }
        await nextTick()
        if (!el || !before) return
        const after = el.getBoundingClientRect()
        const { vw, vh } = viewport()
        const right = vw - before.right < before.left
        const bottom = vh - before.bottom < before.top
        place(right ? before.right - after.width : before.left, bottom ? before.bottom - after.height : before.top)
        persist()
    }
    const toggle = () => setCollapsed(!collapsed.value)

    const onPointerDown = (e) => {
        if (e.button !== 0 || e.target.closest?.('button, a, input')) return
        drag = { dx: e.clientX - pos.value.x, dy: e.clientY - pos.value.y }
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dragging.value = true
    }
    const onPointerMove = (e) => {
        if (!drag) return
        place(e.clientX - drag.dx, e.clientY - drag.dy)
    }
    const onPointerUp = () => {
        if (!drag) return
        drag = null
        dragging.value = false
        persist()
    }
    const onDoubleClick = (e) => {
        if (!e.target.closest?.('button')) toggle()
    }
    // the handle is focusable: arrows move the window (Shift for bigger steps), Enter folds it
    const onKeyDown = (e) => {
        const step = e.shiftKey ? KEY_STEP_FAST : KEY_STEP
        const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key]
        if (delta) {
            e.preventDefault()
            place(pos.value.x + delta[0], pos.value.y + delta[1], false)
            persist()
        } else if (e.key === 'Enter' && e.target === e.currentTarget) {
            e.preventDefault()
            toggle()
        }
    }

    const relayout = () => place(pos.value.x, pos.value.y)

    onMounted(() => {
        window.addEventListener('resize', relayout)
        relayout()
    })
    onBeforeUnmount(() => window.removeEventListener('resize', relayout))

    const style = computed(() => ({ transform: `translate(${pos.value.x}px, ${pos.value.y}px)` }))

    return {
        style,
        collapsed,
        dragging,
        toggle,
        relayout,
        handle: {
            onPointerdown: onPointerDown,
            onPointermove: onPointerMove,
            onPointerup: onPointerUp,
            onPointercancel: onPointerUp,
            onDblclick: onDoubleClick,
            onKeydown: onKeyDown,
        },
    }
}
