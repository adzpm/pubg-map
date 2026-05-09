import {onMounted, onBeforeUnmount} from 'vue'
import {usePersistentRef} from '@/composables/usePersistentRef'

const SEQUENCE = ['KeyD', 'KeyE', 'KeyV']
const WINDOW_MS = 5000

const isTypingTarget = (target) => {
    if (!target) return false
    if (target.isContentEditable) return true
    const tag = target.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export const useDevMode = () => {
    const enabled = usePersistentRef('devMode.enabled', false)
    let buffer = []

    const onKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return
        if (isTypingTarget(e.target)) return

        const now = Date.now()
        buffer = buffer.filter((entry) => now - entry.t < WINDOW_MS)
        buffer.push({code: e.code, t: now})

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

    return {enabled, disable}
}
