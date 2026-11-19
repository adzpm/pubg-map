import { onMounted, onBeforeUnmount } from 'vue'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { hasModifier, isTypingTarget } from '@/lib/keyboard'

const SEQUENCE = ['KeyD', 'KeyE', 'KeyV']
const WINDOW_MS = 5000

/** Persistent dev-mode flag toggled by typing the D-E-V key sequence outside form fields. */
export const useDevMode = () => {
    const enabled = usePersistentRef('devMode.enabled', false)
    let buffer = []

    const onKeyDown = (e) => {
        if (hasModifier(e)) return
        if (isTypingTarget(e.target)) return

        const now = Date.now()
        buffer = buffer.filter((entry) => now - entry.t < WINDOW_MS)
        buffer.push({ code: e.code, t: now })

        if (buffer.length < SEQUENCE.length) return
        const tail = buffer.slice(-SEQUENCE.length)
        const matches = tail.every((entry, i) => entry.code === SEQUENCE[i])
        if (matches) {
            buffer = []
            enabled.value = !enabled.value
        }
    }

    onMounted(() => window.addEventListener('keydown', onKeyDown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))

    const disable = () => {
        enabled.value = false
        buffer = []
    }

    return { enabled, disable }
}
