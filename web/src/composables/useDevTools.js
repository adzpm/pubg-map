import { computed } from 'vue'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { DEV_TOOLS } from '@/lib/devTools'

/** Per-tool persistent enable flags plus dispatch(event, payload) fanning out to enabled tools' handlers. */
export const useDevTools = () => {
    const tools = DEV_TOOLS.map((tool) => ({
        tool,
        enabled: usePersistentRef(`devTools.${tool.id}.enabled`, tool.defaultEnabled ?? false),
    }))

    const dispatch = (event, payload) => {
        for (const { tool, enabled } of tools) {
            if (!enabled.value) continue
            const handler = tool.handlers?.[event]
            if (typeof handler === 'function') handler(payload)
        }
    }

    const anyEnabled = computed(() => tools.some(({ enabled }) => enabled.value))

    return { tools, dispatch, anyEnabled }
}
