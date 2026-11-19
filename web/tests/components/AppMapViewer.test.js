import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import AppMapViewer from '@/components/AppMapViewer.vue'
import { useLeafletMap } from '@/composables/useLeafletMap'

vi.mock('@/composables/useLeafletMap', () => ({ useLeafletMap: vi.fn() }))

const MAP = { id: 'alpha', name: 'Alpha', cells: { x: 3, y: 2 } }

describe('AppMapViewer edge labels', () => {
    let axes

    beforeEach(() => {
        // three 300px columns, the first starting off-screen; two 250px rows
        axes = shallowRef({
            cols: [
                { index: 0, label: 'A', a: -200, b: 100 },
                { index: 1, label: 'B', a: 100, b: 400 },
                { index: 2, label: 'C', a: 900, b: 1200 },
            ],
            rows: [
                { index: 0, label: '1', a: 0, b: 250 },
                { index: 1, label: '2', a: 250, b: 500 },
            ],
        })
        useLeafletMap.mockReturnValue({ map: shallowRef(null), axes })
        Object.defineProperties(HTMLElement.prototype, {
            clientWidth: { configurable: true, get: () => 800 },
            clientHeight: { configurable: true, get: () => 600 },
        })
    })

    afterEach(() => {
        delete HTMLElement.prototype.clientWidth
        delete HTMLElement.prototype.clientHeight
    })

    const labels = (wrapper, edge) => wrapper.findAll(`.edge-${edge} span`)

    // labels need the container size, known once the template ref is bound after the first render
    const mountViewer = async (props) => {
        const wrapper = mount(AppMapViewer, { props: { currentMap: MAP, ...props } })
        await nextTick()
        return wrapper
    }

    it('pins each label to the middle of the on-screen part of its cell and drops off-screen ones', async () => {
        const wrapper = await mountViewer()
        const cols = labels(wrapper, 'x')

        expect(cols.map((s) => s.text())).toEqual(['A', 'B'])
        // A spans -200..100 but only 28..100 is clear of the screen end
        expect(cols[0].attributes('style')).toContain('left: 64px')
        expect(cols[1].attributes('style')).toContain('left: 250px')
        expect(labels(wrapper, 'y').map((s) => s.text())).toEqual(['1', '2'])
    })

    it('highlights the column and row under the cursor', async () => {
        const wrapper = await mountViewer({ cursor: { col: 1, row: 0 } })

        expect(labels(wrapper, 'x')[1].classes()).toContain('on')
        expect(labels(wrapper, 'x')[0].classes()).not.toContain('on')
        expect(labels(wrapper, 'y')[0].classes()).toContain('on')
    })

    it('hides the labels together with the grid', async () => {
        const wrapper = await mountViewer({ gridVisible: false })

        expect(wrapper.find('.edge').exists()).toBe(false)
    })
})
