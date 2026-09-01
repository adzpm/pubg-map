import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useDevMode } from '@/composables/useDevMode'

const press = (code, init = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { code, ...init }))

const pressSequence = (...codes) => codes.forEach((code) => press(code))

describe('useDevMode', () => {
    let dev
    let wrapper

    const Harness = defineComponent({
        setup() {
            dev = useDevMode()
            return () => h('div')
        },
    })

    beforeEach(() => {
        localStorage.clear()
        vi.useFakeTimers()
        wrapper = mount(Harness)
    })

    afterEach(() => {
        wrapper.unmount()
        vi.useRealTimers()
    })

    it('starts disabled and toggles on each D, E, V sequence', () => {
        expect(dev.enabled.value).toBe(false)

        pressSequence('KeyD', 'KeyE', 'KeyV')
        expect(dev.enabled.value).toBe(true)

        pressSequence('KeyD', 'KeyE', 'KeyV')
        expect(dev.enabled.value).toBe(false)
    })

    it('persists the flag and restores it on the next mount', async () => {
        pressSequence('KeyD', 'KeyE', 'KeyV')
        await nextTick()
        expect(localStorage.getItem('pubg-map:devMode.enabled')).toBe('true')

        wrapper.unmount()
        wrapper = mount(Harness)
        expect(dev.enabled.value).toBe(true)
    })

    it('does not toggle when the sequence is interrupted by another key', () => {
        pressSequence('KeyD', 'KeyE', 'KeyX', 'KeyV')
        expect(dev.enabled.value).toBe(false)
    })

    it('still toggles when a full sequence follows a broken one', () => {
        pressSequence('KeyD', 'KeyX', 'KeyD', 'KeyE', 'KeyV')
        expect(dev.enabled.value).toBe(true)
    })

    it('ignores keys typed into form fields', () => {
        const input = document.createElement('input')
        document.body.appendChild(input)

        pressSequence('KeyD', 'KeyE')
        input.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', bubbles: true }))
        expect(dev.enabled.value).toBe(false)

        // the buffered D, E survive: a V outside the field completes the sequence
        press('KeyV')
        expect(dev.enabled.value).toBe(true)

        input.remove()
    })

    it('ignores keystrokes with ctrl, meta or alt held', () => {
        pressSequence('KeyD', 'KeyE')
        press('KeyV', { ctrlKey: true })
        press('KeyV', { metaKey: true })
        press('KeyV', { altKey: true })
        expect(dev.enabled.value).toBe(false)

        press('KeyV')
        expect(dev.enabled.value).toBe(true)
    })

    it('expires buffered keys after the 5 second window', () => {
        pressSequence('KeyD', 'KeyE')
        vi.advanceTimersByTime(5001)
        press('KeyV')
        expect(dev.enabled.value).toBe(false)
    })

    it('keeps keys pressed within the 5 second window', () => {
        press('KeyD')
        vi.advanceTimersByTime(2000)
        press('KeyE')
        vi.advanceTimersByTime(2000)
        press('KeyV')
        expect(dev.enabled.value).toBe(true)
    })

    it('disable() turns dev mode off and clears the key buffer', () => {
        pressSequence('KeyD', 'KeyE', 'KeyV')
        expect(dev.enabled.value).toBe(true)

        pressSequence('KeyD', 'KeyE')
        dev.disable()
        press('KeyV')
        expect(dev.enabled.value).toBe(false)
    })

    it('stops listening after unmount', () => {
        wrapper.unmount()
        pressSequence('KeyD', 'KeyE', 'KeyV')
        expect(dev.enabled.value).toBe(false)

        wrapper = mount(Harness)
    })
})
