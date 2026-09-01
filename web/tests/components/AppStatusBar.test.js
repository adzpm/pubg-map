import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppStatusBar from '@/components/AppStatusBar.vue'

describe('AppStatusBar', () => {
    it('shows the cell and pixel coordinates when the cursor is visible', () => {
        const wrapper = mount(AppStatusBar, {
            props: { cursor: { visible: true, px: 1234, py: 567, cell: 'C4' } },
        })

        const values = wrapper.findAll('strong').map((node) => node.text())
        expect(values).toEqual(['C4', '1234', '567'])
        expect(wrapper.text()).toContain('Cell:')
        expect(wrapper.text()).toContain('X:')
        expect(wrapper.text()).toContain('Y:')
    })

    it('renders nothing when the cursor is not visible', () => {
        const wrapper = mount(AppStatusBar, {
            props: { cursor: { visible: false, px: 0, py: 0, cell: '' } },
        })

        expect(wrapper.find('div').exists()).toBe(false)
        expect(wrapper.text()).toBe('')
    })
})
