import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import AppWindow from '@/components/AppWindow.vue'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { MAPS } from '@/data/maps'

vi.mock('@/composables/useLeafletMap', () => ({
    useLeafletMap: vi.fn(() => ({ map: { value: null } })),
}))

const mapButton = (wrapper, name) => wrapper.findAll('.maps button').find((b) => b.find('.name').text() === name)

const press = async (code) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }))
    await nextTick()
}

describe('App', () => {
    let wrapper

    beforeEach(() => {
        wrapper?.unmount()
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('starts on the first map by default and wires it into the viewer', () => {
        wrapper = mount(App)

        expect(wrapper.findComponent(AppWindow).props('currentMap')).toEqual(MAPS[0])
        expect(useLeafletMap).toHaveBeenCalledTimes(1)
        expect(useLeafletMap.mock.calls[0][1].currentMap.value).toEqual(MAPS[0])
    })

    it('restores the persisted map id on startup', () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('taego'))

        wrapper = mount(App)

        expect(wrapper.findComponent(AppWindow).props('currentMap').id).toBe('taego')
    })

    it('falls back to the first map when the persisted id is unknown', () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('does-not-exist'))

        wrapper = mount(App)

        expect(wrapper.findComponent(AppWindow).props('currentMap')).toEqual(MAPS[0])
    })

    it('selecting a map in the window switches it and persists the id', async () => {
        wrapper = mount(App)
        const target = MAPS.find((m) => m.id === 'vikendi')

        await mapButton(wrapper, target.name).trigger('click')
        await nextTick()

        expect(wrapper.findComponent(AppWindow).props('currentMap')).toEqual(target)
        expect(localStorage.getItem('pubg-map:currentMapId')).toBe(JSON.stringify('vikendi'))
    })

    it('rewrites an unknown persisted id back to a valid one', async () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('does-not-exist'))

        wrapper = mount(App)
        await nextTick()

        expect(localStorage.getItem('pubg-map:currentMapId')).toBe(JSON.stringify(MAPS[0].id))
    })

    it('passes the secret room count of the current map to the window', async () => {
        wrapper = mount(App)
        expect(wrapper.findComponent(AppWindow).props('secretsCount')).toBeGreaterThan(0)

        await mapButton(wrapper, 'Karakin').trigger('click')

        expect(wrapper.findComponent(AppWindow).props('secretsCount')).toBe(0)
    })

    it('number keys pick the n-th map', async () => {
        wrapper = mount(App)

        await press('Digit3')
        expect(wrapper.findComponent(AppWindow).props('currentMap')).toEqual(MAPS[2])

        await press('Numpad1')
        expect(wrapper.findComponent(AppWindow).props('currentMap')).toEqual(MAPS[0])
    })

    it('G toggles the grid and R toggles secret rooms only where the map has them', async () => {
        wrapper = mount(App)
        const win = () => wrapper.findComponent(AppWindow)

        await press('KeyG')
        expect(win().props('gridVisible')).toBe(false)
        await press('KeyR')
        expect(win().props('secretsVisible')).toBe(false)

        await mapButton(wrapper, 'Karakin').trigger('click')
        await press('KeyR')
        expect(win().props('secretsVisible')).toBe(false)
    })
})
