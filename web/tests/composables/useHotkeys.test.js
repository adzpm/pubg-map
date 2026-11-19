/* eslint-disable vue/one-component-per-file -- small inline harnesses, one per test */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useHotkeys } from '@/composables/useHotkeys'

const maps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

describe('useHotkeys', () => {
    let wrapper
    let handlers

    const press = (code, init = {}, target = window) => {
        const event = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init })
        target.dispatchEvent(event)
        return event
    }

    beforeEach(() => {
        handlers = { select: vi.fn(), toggleGrid: vi.fn(), toggleSecrets: vi.fn() }
        wrapper = mount(
            defineComponent({
                setup() {
                    useHotkeys({ maps, ...handlers })
                    return () => h('input')
                },
            }),
            { attachTo: document.body },
        )
    })

    afterEach(() => wrapper.unmount())

    it('picks the n-th map with the digit row and the numpad', () => {
        press('Digit2')
        press('Numpad3')
        expect(handlers.select.mock.calls).toEqual([[maps[1]], [maps[2]]])
    })

    it('ignores digits past the number of maps', () => {
        expect(press('Digit9').defaultPrevented).toBe(false)
        expect(handlers.select).not.toHaveBeenCalled()
    })

    it('toggles the grid with G and secret rooms with R, by physical key', () => {
        expect(press('KeyG').defaultPrevented).toBe(true)
        press('KeyR')
        expect(handlers.toggleGrid).toHaveBeenCalledTimes(1)
        expect(handlers.toggleSecrets).toHaveBeenCalledTimes(1)
    })

    it('leaves other keys and modified shortcuts to the browser', () => {
        expect(press('KeyX').defaultPrevented).toBe(false)
        expect(press('KeyR', { metaKey: true }).defaultPrevented).toBe(false)
        expect(press('Digit1', { ctrlKey: true }).defaultPrevented).toBe(false)
        expect(handlers.toggleSecrets).not.toHaveBeenCalled()
        expect(handlers.select).not.toHaveBeenCalled()
    })

    it('stays quiet while typing in a field', () => {
        press('KeyG', {}, wrapper.find('input').element)
        expect(handlers.toggleGrid).not.toHaveBeenCalled()
    })

    it('stops listening once unmounted', () => {
        wrapper.unmount()
        press('KeyG')
        expect(handlers.toggleGrid).not.toHaveBeenCalled()
        wrapper = mount(defineComponent({ render: () => h('div') }))
    })
})
