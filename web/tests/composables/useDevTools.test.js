import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useDevTools } from '@/composables/useDevTools'
import { DEV_TOOLS } from '@/lib/devTools'

vi.mock('@/lib/devTools', () => ({
    DEV_TOOLS: [
        { id: 'alpha', name: 'Alpha', defaultEnabled: true, handlers: { onMapClick: vi.fn() } },
        { id: 'beta', name: 'Beta', handlers: { onMapClick: vi.fn(), onOther: vi.fn() } },
        { id: 'gamma', name: 'Gamma', defaultEnabled: true },
    ],
}))

const [alpha, beta] = DEV_TOOLS

describe('useDevTools', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('exposes one entry per registered tool with its defaultEnabled flag', () => {
        const { tools } = useDevTools()

        expect(tools.map(({ tool }) => tool.id)).toEqual(['alpha', 'beta', 'gamma'])
        expect(tools.map(({ enabled }) => enabled.value)).toEqual([true, false, true])
    })

    it('dispatch calls only handlers of enabled tools, with the payload', () => {
        const { dispatch } = useDevTools()
        const payload = { x: 12, y: 34, mapId: 'erangel' }

        dispatch('onMapClick', payload)

        expect(alpha.handlers.onMapClick).toHaveBeenCalledExactlyOnceWith(payload)
        expect(beta.handlers.onMapClick).not.toHaveBeenCalled()
    })

    it('dispatch respects enabled flags changed at runtime', () => {
        const { tools, dispatch } = useDevTools()
        tools[0].enabled.value = false
        tools[1].enabled.value = true

        dispatch('onMapClick', { x: 1, y: 2 })

        expect(alpha.handlers.onMapClick).not.toHaveBeenCalled()
        expect(beta.handlers.onMapClick).toHaveBeenCalledExactlyOnceWith({ x: 1, y: 2 })
    })

    it('dispatch skips tools without a handler for the event', () => {
        const { dispatch } = useDevTools()

        expect(() => dispatch('onOther', 'payload')).not.toThrow()
        expect(beta.handlers.onOther).not.toHaveBeenCalled()
        expect(alpha.handlers.onMapClick).not.toHaveBeenCalled()
    })

    it('anyEnabled reflects whether at least one tool is enabled', () => {
        const { tools, anyEnabled } = useDevTools()
        expect(anyEnabled.value).toBe(true)

        for (const { enabled } of tools) enabled.value = false
        expect(anyEnabled.value).toBe(false)

        tools[1].enabled.value = true
        expect(anyEnabled.value).toBe(true)
    })

    it('persists per-tool flags and restores them for later instances', async () => {
        const first = useDevTools()
        first.tools[1].enabled.value = true
        first.tools[0].enabled.value = false
        await nextTick()

        expect(localStorage.getItem('pubg-map:devTools.beta.enabled')).toBe('true')
        expect(localStorage.getItem('pubg-map:devTools.alpha.enabled')).toBe('false')

        const second = useDevTools()
        expect(second.tools.map(({ enabled }) => enabled.value)).toEqual([false, true, true])
    })
})
