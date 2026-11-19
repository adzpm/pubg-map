/* eslint-disable vue/one-component-per-file -- small inline harnesses, one per test */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { clampToViewport, MARGIN, useFloatingWindow } from '@/composables/useFloatingWindow'

const VIEW = { vw: 1000, vh: 800 }
const SIZE = { w: 300, h: 200 }
const MAX_X = VIEW.vw - SIZE.w - MARGIN
const MAX_Y = VIEW.vh - SIZE.h - MARGIN

describe('clampToViewport', () => {
    it('leaves a position well inside the viewport alone', () => {
        expect(clampToViewport({ x: 300, y: 250 }, SIZE, VIEW)).toEqual({ x: 300, y: 250 })
    })

    it('keeps the whole window on screen', () => {
        expect(clampToViewport({ x: -50, y: -50 }, SIZE, VIEW)).toEqual({ x: MARGIN, y: MARGIN })
        expect(clampToViewport({ x: 5000, y: 5000 }, SIZE, VIEW)).toEqual({ x: MAX_X, y: MAX_Y })
    })

    it('snaps to an edge within the snap distance', () => {
        expect(clampToViewport({ x: MARGIN + 20, y: MAX_Y - 20 }, SIZE, VIEW)).toEqual({ x: MARGIN, y: MAX_Y })
    })

    it('does not snap when asked not to (keyboard nudges)', () => {
        expect(clampToViewport({ x: MARGIN + 20, y: 300 }, SIZE, VIEW, false)).toEqual({ x: MARGIN + 20, y: 300 })
    })

    it('pins a window larger than the viewport to the top-left margin', () => {
        expect(clampToViewport({ x: 100, y: 100 }, { w: 2000, h: 2000 }, VIEW)).toEqual({ x: MARGIN, y: MARGIN })
    })
})

describe('useFloatingWindow', () => {
    let floating
    let wrapper

    const mountHarness = () => {
        const Harness = defineComponent({
            setup() {
                const el = ref(null)
                floating = useFloatingWindow(el, 'test-window')
                return () => h('section', { ref: el, style: floating.style.value }, [h('header', floating.handle)])
            },
        })
        wrapper = mount(Harness, { attachTo: document.body })
        const el = wrapper.element
        Object.defineProperties(el, {
            offsetWidth: { configurable: true, value: SIZE.w },
            offsetHeight: { configurable: true, value: SIZE.h },
        })
        return wrapper.find('header')
    }

    const position = () => {
        const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(wrapper.element.style.transform)
        return { x: Number(m[1]), y: Number(m[2]) }
    }

    const stored = () => JSON.parse(localStorage.getItem('pubg-map:test-window'))

    beforeEach(() => {
        localStorage.clear()
        window.innerWidth = VIEW.vw
        window.innerHeight = VIEW.vh
    })

    afterEach(() => wrapper?.unmount())

    it('drags with the pointer and stores the position when the drag ends', async () => {
        const head = mountHarness()

        await head.trigger('pointerdown', { button: 0, clientX: 20, clientY: 20, pointerId: 1 })
        await head.trigger('pointermove', { clientX: 320, clientY: 270 })
        expect(position()).toEqual({ x: 312, y: 262 })
        expect(floating.dragging.value).toBe(true)
        expect(stored()).toBeNull()

        await head.trigger('pointerup')
        expect(floating.dragging.value).toBe(false)
        expect(stored()).toMatchObject({ x: 312, y: 262, collapsed: false })
    })

    it('ignores drags that start on a button inside the handle', async () => {
        const Harness = defineComponent({
            setup() {
                const el = ref(null)
                floating = useFloatingWindow(el, 'test-window')
                return () => h('section', { ref: el }, [h('header', floating.handle, [h('button', 'x')])])
            },
        })
        wrapper = mount(Harness, { attachTo: document.body })

        await wrapper.find('button').trigger('pointerdown', { button: 0, clientX: 20, clientY: 20 })
        expect(floating.dragging.value).toBe(false)
    })

    it('restores a stored position and keeps it on screen', async () => {
        localStorage.setItem('pubg-map:test-window', JSON.stringify({ x: 5000, y: 300, collapsed: false }))
        mountHarness()
        floating.relayout()
        await nextTick()

        expect(position()).toEqual({ x: MAX_X, y: 300 })
    })

    it('falls back to the top-left corner when the stored state is malformed', async () => {
        localStorage.setItem('pubg-map:test-window', JSON.stringify({ x: 'left' }))
        mountHarness()
        await nextTick()

        expect(position()).toEqual({ x: MARGIN, y: MARGIN })
        expect(floating.collapsed.value).toBe(false)
    })

    it('moves with arrow keys without snapping, and folds with Enter', async () => {
        localStorage.setItem('pubg-map:test-window', JSON.stringify({ x: 300, y: 300, collapsed: false }))
        const head = mountHarness()

        await head.trigger('keydown', { key: 'ArrowRight' })
        await head.trigger('keydown', { key: 'ArrowDown', shiftKey: true })
        expect(position()).toEqual({ x: 312, y: 348 })
        expect(stored()).toMatchObject({ x: 312, y: 348 })

        await head.trigger('keydown', { key: 'Enter' })
        expect(floating.collapsed.value).toBe(true)
    })
})
