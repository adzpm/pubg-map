import { beforeEach, describe, expect, it } from 'vitest'
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
            ...props,
        },
    })

const buttonByText = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().includes(text))

describe('AppWindow', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('shows the current map with its size in the header', () => {
        const wrapper = mountWindow()

        expect(wrapper.find('.title').text()).toBe('Alpha Isle8×8 km')
    })

    it('renders a button per map with its hotkey and size and marks the current one', () => {
        const wrapper = mountWindow()
        const [alpha, beta] = wrapper.findAll('.maps button')

        expect(alpha.find('.key').text()).toBe('1')
        expect(beta.find('.key').text()).toBe('2')
        expect(beta.find('.km').text()).toBe('4×4 km')
        expect(alpha.attributes('aria-pressed')).toBe('true')
        expect(beta.attributes('aria-pressed')).toBe('false')
    })

    it('emits select with the map object when a map is clicked', async () => {
        const wrapper = mountWindow()

        await buttonByText(wrapper, 'Beta Ridge').trigger('click')

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

        expect(toggle.text()).toBe('Secret rooms 3')
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
