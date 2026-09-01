import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import AppSidebar from '@/components/AppSidebar.vue'

const maps = [
    { id: 'alpha', name: 'Alpha Isle', cells: { x: 8, y: 8 } },
    { id: 'beta', name: 'Beta Ridge', cells: { x: 4, y: 4 } },
]

const mountSidebar = (props = {}) =>
    mount(AppSidebar, {
        props: {
            maps,
            currentMap: maps[0],
            gridVisible: true,
            secretsVisible: true,
            statusBarVisible: true,
            secretsAvailable: true,
            ...props,
        },
    })

const linkByText = (wrapper, text) => wrapper.findAll('a').find((a) => a.text().includes(text))

describe('AppSidebar', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('renders a row per map with its grid size and highlights the current one', () => {
        const wrapper = mountSidebar()

        const alphaRow = linkByText(wrapper, 'Alpha Isle')
        const betaRow = linkByText(wrapper, 'Beta Ridge')

        expect(alphaRow.text()).toContain('8×8')
        expect(betaRow.text()).toContain('4×4')
        expect(alphaRow.classes()).toContain('text-bg-light')
        expect(betaRow.classes()).not.toContain('text-bg-light')
    })

    it('emits select with the map object when a map row is clicked', async () => {
        const wrapper = mountSidebar()

        await linkByText(wrapper, 'Beta Ridge').trigger('click')

        expect(wrapper.emitted('select')).toEqual([[maps[1]]])
    })

    it('toggles the grid v-model when the Grid row is clicked', async () => {
        const wrapper = mountSidebar({ gridVisible: true })

        await linkByText(wrapper, 'Grid').trigger('click')
        expect(wrapper.emitted('update:gridVisible')).toEqual([[false]])
    })

    it('toggles the secrets v-model when secrets are available', async () => {
        const wrapper = mountSidebar({ secretsVisible: false })

        await linkByText(wrapper, 'Secrets').trigger('click')
        expect(wrapper.emitted('update:secretsVisible')).toEqual([[true]])
    })

    it('disables the Secrets row when the map has no secret rooms', async () => {
        const wrapper = mountSidebar({ secretsAvailable: false })
        const secretsRow = linkByText(wrapper, 'Secrets')

        expect(secretsRow.classes()).toContain('pe-none')
        expect(secretsRow.attributes('aria-disabled')).toBe('true')

        await secretsRow.trigger('click')
        expect(wrapper.emitted('update:secretsVisible')).toBeUndefined()
    })

    it('hides the dev tools section outside dev mode', () => {
        const wrapper = mountSidebar({
            devMode: false,
            devTools: [{ tool: { id: 't1', name: 'Tool One' }, enabled: ref(false) }],
        })

        expect(wrapper.text()).not.toContain('Dev Tools')
        expect(wrapper.text()).not.toContain('Tool One')
    })

    it('lists dev tools in dev mode and toggles them on click', async () => {
        const enabled = ref(false)
        const wrapper = mountSidebar({
            devMode: true,
            devTools: [{ tool: { id: 't1', name: 'Tool One', description: 'desc', icon: 'bi-x' }, enabled }],
        })

        expect(wrapper.text()).toContain('Dev Tools')
        const toolRow = linkByText(wrapper, 'Tool One')
        expect(toolRow.classes()).not.toContain('text-bg-light')

        await toolRow.trigger('click')
        expect(enabled.value).toBe(true)
        expect(toolRow.classes()).toContain('text-bg-light')
    })

    it('toggles the status bar v-model from the dev tools section', async () => {
        const wrapper = mountSidebar({ devMode: true, statusBarVisible: true })

        await linkByText(wrapper, 'Status bar').trigger('click')
        expect(wrapper.emitted('update:statusBarVisible')).toEqual([[false]])
    })

    it('collapses the whole panel via the header button', async () => {
        const wrapper = mountSidebar()
        expect(linkByText(wrapper, 'Alpha Isle')).toBeDefined()

        await wrapper.find('button[aria-label="Toggle sidebar"]').trigger('click')

        expect(linkByText(wrapper, 'Alpha Isle')).toBeUndefined()
        expect(wrapper.text()).not.toContain('Layers')
    })
})
