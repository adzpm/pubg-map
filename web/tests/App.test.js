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

const mapButton = (wrapper, name) => wrapper.findAll('.maps a').find((b) => b.find('.name').text() === name)

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
        window.history.replaceState(null, '', '/')
        document.head.innerHTML = '<meta name="description" content="" /><link rel="canonical" href="" />'
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

    it('V toggles vehicle spawns, off by default and only where the map has them', async () => {
        wrapper = mount(App)
        const win = () => wrapper.findComponent(AppWindow)
        expect(win().props('vehiclesVisible')).toBe(false)

        await press('KeyV')
        expect(win().props('vehiclesVisible')).toBe(true)

        await mapButton(wrapper, 'Karakin').trigger('click')
        expect(win().props('vehiclesCount')).toBe(0)
        await press('KeyV')
        expect(win().props('vehiclesVisible')).toBe(true)
    })

    it('F folds and unfolds the window', async () => {
        wrapper = mount(App, { attachTo: document.body })

        await press('KeyF')
        await nextTick()
        expect(wrapper.find('.field-window .body').exists()).toBe(false)

        await press('KeyF')
        await nextTick()
        expect(wrapper.find('.field-window .body').exists()).toBe(true)
    })

    it('opens the map named in the address, over the remembered one', () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('taego'))
        window.history.replaceState(null, '', '/vikendi')

        wrapper = mount(App)

        expect(wrapper.findComponent(AppWindow).props('currentMap').id).toBe('vikendi')
        expect(document.title).toContain('Vikendi')
        expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(
            'https://pubg.adz.pm/vikendi',
        )
    })

    it('describes the site on the home page and the map once one is picked', async () => {
        wrapper = mount(App)
        expect(document.title).toBe('PUBG interactive maps: secret rooms, vehicle spawns, grid')

        await mapButton(wrapper, 'Erangel').trigger('click')
        await nextTick()

        expect(window.location.pathname).toBe('/erangel')
        expect(document.title).toContain('Erangel')
        expect(document.head.querySelector('meta[name="description"]').getAttribute('content')).toContain('Erangel')
    })

    it('puts the picked map in the address and keeps the query string', async () => {
        window.history.replaceState(null, '', '/?dev=1')
        wrapper = mount(App)

        await press('Digit3')

        expect(window.location.pathname).toBe(`/${MAPS[2].id}`)
        expect(window.location.search).toBe('?dev=1')
    })

    it('follows Back and Forward', async () => {
        window.history.replaceState(null, '', '/taego')
        wrapper = mount(App)

        window.history.replaceState(null, '', '/sanhok')
        window.dispatchEvent(new PopStateEvent('popstate'))
        await nextTick()

        expect(wrapper.findComponent(AppWindow).props('currentMap').id).toBe('sanhok')
        expect(document.title).toContain('Sanhok')
    })
})
