import { onBeforeUnmount, onMounted } from 'vue'
import { hasModifier, isTypingTarget } from '@/lib/keyboard'

/**
 * Global shortcuts: 1–9 pick the n-th map, G toggles the grid, R toggles secret rooms, F folds the window.
 * Uses e.code, so they work on any keyboard layout; ignored while typing or with modifiers held.
 */
export const useHotkeys = ({ maps, select, toggleGrid, toggleSecrets, toggleWindow }) => {
    const onKeyDown = (e) => {
        if (hasModifier(e) || isTypingTarget(e.target)) return

        const digit = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)
        if (digit) {
            const map = maps[Number(digit[1]) - 1]
            if (!map) return
            select(map)
        } else if (e.code === 'KeyG') {
            toggleGrid()
        } else if (e.code === 'KeyR') {
            toggleSecrets()
        } else if (e.code === 'KeyF' && toggleWindow) {
            toggleWindow()
        } else {
            return
        }
        e.preventDefault()
    }

    onMounted(() => window.addEventListener('keydown', onKeyDown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
