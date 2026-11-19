import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppKey from '@/components/AppKey.vue'

describe('AppKey', () => {
    it('renders a single key as one cap', () => {
        const wrapper = mount(AppKey, { props: { keys: 'G' } })

        expect(wrapper.findAll('kbd').map((k) => k.text())).toEqual(['G'])
        expect(wrapper.find('.plus').exists()).toBe(false)
    })

    it('renders a combination as one cap per key, joined by a plus', () => {
        const wrapper = mount(AppKey, { props: { keys: 'Alt+M' } })

        expect(wrapper.findAll('kbd').map((k) => k.text())).toEqual(['Alt', 'M'])
        expect(wrapper.findAll('.plus')).toHaveLength(1)
    })

    it('is hidden from assistive tech: the control carries aria-keyshortcuts instead', () => {
        expect(mount(AppKey, { props: { keys: 'G' } }).attributes('aria-hidden')).toBe('true')
    })
})
