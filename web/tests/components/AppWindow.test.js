import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import AppWindow from '@/components/AppWindow.vue'

const maps = [
    { id: 'alpha', name: 'Alpha Isle', cells: { x: 8, y: 8 } },
    { id: 'beta', name: 'Beta Ridge', cells: { x: 4, y: 4 } },
]

const HIDDEN = { visible: false, px: 0, py: 0, cell: '', col: -1, row: -1 }

const mountWindow = (props = {}) =>
    mount(AppWindow, {
        props: {
            maps,
            currentMap: maps[0],
            cursor: HIDDEN,
            gridVisible: true,
            secretsVisible: true,
            statusBarVisible: true,
            secretsCount: 3,
            vehiclesCount: 0,
            ...props,
        },
    })

const buttonByText = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))

describe('AppWindow', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('shows the current map with its size in the header', () => {
        const wrapper = mountWindow()

        expect(wrapper.find('.title').text()).toBe('Alpha Isle8×8 km')
    })

    it('renders a link per map with its address, hotkey and size and marks the current one', () => {
        const wrapper = mountWindow()
        const [alpha, beta] = wrapper.findAll('.maps a')

        expect(alpha.find('.key').text()).toBe('1')
        expect(beta.find('.key').text()).toBe('2')
        expect(beta.find('.km').text()).toBe('4×4 km')
        expect(beta.attributes('href')).toBe(`/${maps[1].id}`)
        expect(alpha.attributes('aria-current')).toBe('page')
        expect(beta.attributes('aria-current')).toBeUndefined()
    })

    it('leaves a modified click to the browser so a map can open in a new tab', async () => {
        const wrapper = mountWindow()

        await wrapper.findAll('.maps a')[1].trigger('click', { ctrlKey: true })

        expect(wrapper.emitted('select')).toBeUndefined()
    })

    it('picks the map on any click inside the overlay, where there are no tabs to open', async () => {
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 pubg-map-overlay/0.2.0 Electron/45.4.1' })
        const wrapper = mountWindow()

        await wrapper.findAll('.maps a')[1].trigger('click', { ctrlKey: true })

        expect(wrapper.emitted('select')).toEqual([[maps[1]]])
    })

    it('says in words what the page shows, and lists the maps on the home page', () => {
        const page = {
            id: 'alpha',
            heading: 'Alpha map',
            about: 'An island.',
            lines: [{ text: '3 secret rooms marked' }],
            sections: [{ heading: 'Using the map', lines: [{ text: 'Scroll to zoom.' }] }],
        }
        const about = mountWindow({ page }).find('.about')

        expect(about.find('h1').text()).toBe('Alpha map')
        expect(about.text()).toContain('An island.')
        expect(about.text()).toContain('3 secret rooms marked')
        expect(about.find('h2').text()).toBe('Using the map')
        expect(about.text()).toContain('Scroll to zoom.')

        const home = {
            id: null,
            heading: 'Maps',
            about: 'All.',
            lines: [{ href: '/a', label: 'Alpha map', text: '8×8 km' }],
            sections: [],
        }
        expect(mountWindow({ page: home }).find('.about li').text()).toBe('Alpha map: 8×8 km')
        expect(mountWindow().find('.about').exists()).toBe(false)
    })

    it('emits select with the map object when a map is clicked', async () => {
        const wrapper = mountWindow()

        await wrapper.findAll('.maps a')[1].trigger('click')

        expect(wrapper.emitted('select')).toEqual([[maps[1]]])
    })

    it('shows the square under the cursor, or a dash when the cursor is off the map', async () => {
        const wrapper = mountWindow()
        expect(wrapper.find('.cell').text()).toBe('—')
        expect(wrapper.find('.cell').classes()).toContain('idle')

        await wrapper.setProps({ cursor: { visible: true, px: 1, py: 2, cell: 'C4', col: 2, row: 3 } })
        expect(wrapper.find('.cell').text()).toBe('C4')
        expect(wrapper.find('.cell').classes()).not.toContain('idle')
    })

    it('toggles the grid v-model', async () => {
        const wrapper = mountWindow({ gridVisible: true })

        await buttonByText(wrapper, 'Grid').trigger('click')

        expect(wrapper.emitted('update:gridVisible')).toEqual([[false]])
    })

    it('labels the secret rooms toggle with the count and toggles its v-model', async () => {
        const wrapper = mountWindow({ secretsVisible: false })
        const toggle = buttonByText(wrapper, 'Secret rooms')

        expect(toggle.text()).toContain('Secret rooms 3')
        await toggle.trigger('click')
        expect(wrapper.emitted('update:secretsVisible')).toEqual([[true]])
    })

    it('disables the secret rooms toggle on maps without rooms', async () => {
        const wrapper = mountWindow({ secretsCount: 0 })
        const toggle = buttonByText(wrapper, 'No secret rooms')

        expect(toggle.attributes('disabled')).toBeDefined()
        expect(toggle.attributes('aria-pressed')).toBe('false')
        await toggle.trigger('click')
        expect(wrapper.emitted('update:secretsVisible')).toBeUndefined()
    })

    it('offers the vehicle spawns toggle with its count, and a legend while it is on', async () => {
        const wrapper = mountWindow({ vehiclesCount: 694, vehiclesVisible: false })
        const toggle = buttonByText(wrapper, 'Vehicle spawns')

        expect(toggle.text()).toContain('Vehicle spawns 694')
        expect(toggle.find('kbd').text()).toBe('V')
        expect(wrapper.find('.legend').exists()).toBe(false)

        await toggle.trigger('click')
        expect(wrapper.emitted('update:vehiclesVisible')).toEqual([[true]])

        await wrapper.setProps({ vehiclesVisible: true })
        expect(wrapper.find('.legend').text()).toContain('fixed spawn')
        expect(wrapper.find('.legend-note').text()).not.toContain('Not on the map')

        await wrapper.setProps({ vehiclesUnplaced: ['Garage (8 per match)'] })
        expect(wrapper.find('.legend-note').text()).toContain('give no points for them: Garage (8 per match).')
    })

    it('disables the vehicle spawns toggle on maps without vehicles', () => {
        const toggle = buttonByText(mountWindow({ vehiclesVisible: true }), 'No vehicle spawns')

        expect(toggle.attributes('disabled')).toBeDefined()
        expect(toggle.attributes('aria-pressed')).toBe('false')
    })

    it('shows dev tools only in dev mode and toggles them', async () => {
        const enabled = ref(false)
        const devTools = [{ tool: { id: 't1', name: 'Tool One', description: 'desc' }, enabled }]

        expect(buttonByText(mountWindow({ devTools }), 'Tool One')).toBeUndefined()

        const wrapper = mountWindow({ devMode: true, devTools })
        await buttonByText(wrapper, 'Tool One').trigger('click')
        expect(enabled.value).toBe(true)

        await buttonByText(wrapper, 'Status bar').trigger('click')
        expect(wrapper.emitted('update:statusBarVisible')).toEqual([[false]])
    })

    it('shows a keycap for every shortcut: map digits, G, R and F', () => {
        const wrapper = mountWindow()
        const caps = (el) => el.findAll('kbd').map((k) => k.text())

        expect(caps(wrapper.find('.maps'))).toEqual(['1', '2'])
        expect(caps(buttonByText(wrapper, 'Grid'))).toEqual(['G'])
        expect(caps(buttonByText(wrapper, 'Secret rooms'))).toEqual(['R'])
        expect(wrapper.find('.hints').text()).toBe('FFold window')
        expect(wrapper.find('.fold').attributes('aria-keyshortcuts')).toBe('F')
    })

    it('adds the overlay shortcuts when running inside the Electron overlay', () => {
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 pubg-map-overlay/0.1.4 Electron/45.4.1' })
        const hints = mountWindow().find('.hints')

        expect(hints.findAll('kbd').map((k) => k.text())).toEqual(['F', 'Alt', 'M', 'Esc'])
        expect(hints.text()).toContain('Show or hide overlay')
    })

    it('exposes toggle so the F hotkey can fold it', async () => {
        const wrapper = mountWindow()

        wrapper.vm.toggle()
        await nextTick()
        await nextTick()

        expect(wrapper.find('.body').exists()).toBe(false)
    })

    it('folds to the header and remembers it', async () => {
        const wrapper = mountWindow()

        await wrapper.find('.fold').trigger('click')
        await nextTick()

        expect(wrapper.find('.body').exists()).toBe(false)
        expect(wrapper.find('.title').exists()).toBe(true)
        expect(wrapper.find('.fold').attributes('aria-label')).toBe('Unfold window')
        expect(JSON.parse(localStorage.getItem('pubg-map:window')).collapsed).toBe(true)

        const again = mountWindow()
        expect(again.find('.body').exists()).toBe(false)
    })

    it('folds on a double-click on the header, but not on its buttons', async () => {
        const wrapper = mountWindow()

        await wrapper.find('.fold').trigger('dblclick')
        expect(wrapper.find('.body').exists()).toBe(true)

        await wrapper.find('.head').trigger('dblclick')
        await nextTick()
        expect(wrapper.find('.body').exists()).toBe(false)
    })
})
