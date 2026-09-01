import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { useLeafletMap } from '@/composables/useLeafletMap'
import { MAPS } from '@/data/maps'

vi.mock('@/composables/useLeafletMap', () => ({
    useLeafletMap: vi.fn(() => ({ map: { value: null } })),
}))

describe('App', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('starts on the first map by default and wires it into the viewer', () => {
        const wrapper = mount(App)

        expect(wrapper.findComponent(AppSidebar).props('currentMap')).toEqual(MAPS[0])
        expect(useLeafletMap).toHaveBeenCalledTimes(1)
        expect(useLeafletMap.mock.calls[0][1].currentMap.value).toEqual(MAPS[0])
    })

    it('restores the persisted map id on startup', () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('taego'))

        const wrapper = mount(App)

        expect(wrapper.findComponent(AppSidebar).props('currentMap').id).toBe('taego')
    })

    it('falls back to the first map when the persisted id is unknown', () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('does-not-exist'))

        const wrapper = mount(App)

        expect(wrapper.findComponent(AppSidebar).props('currentMap')).toEqual(MAPS[0])
    })

    it('selecting a map in the sidebar switches it and persists the id', async () => {
        const wrapper = mount(App)
        const target = MAPS.find((m) => m.id === 'vikendi')

        await wrapper
            .findAll('a')
            .find((a) => a.text().includes(target.name))
            .trigger('click')
        await nextTick()

        expect(wrapper.findComponent(AppSidebar).props('currentMap')).toEqual(target)
        expect(localStorage.getItem('pubg-map:currentMapId')).toBe(JSON.stringify('vikendi'))
    })

    it('rewrites an unknown persisted id back to a valid one', async () => {
        localStorage.setItem('pubg-map:currentMapId', JSON.stringify('does-not-exist'))

        mount(App)
        await nextTick()

        expect(localStorage.getItem('pubg-map:currentMapId')).toBe(JSON.stringify(MAPS[0].id))
    })

    it('flags secrets availability per map for the sidebar', async () => {
        const wrapper = mount(App)
        expect(wrapper.findComponent(AppSidebar).props('secretsAvailable')).toBe(true)

        const karakin = MAPS.find((m) => m.id === 'karakin')
        await wrapper
            .findAll('a')
            .find((a) => a.text().includes(karakin.name))
            .trigger('click')

        expect(wrapper.findComponent(AppSidebar).props('secretsAvailable')).toBe(false)
    })
})
