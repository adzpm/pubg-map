import { ref, watch } from 'vue'

const PREFIX = 'pubg-map:'

/** A ref persisted to localStorage under 'pubg-map:<key>'; falls back to defaultValue when storage is empty or invalid. */
export const usePersistentRef = (key, defaultValue) => {
    const storageKey = PREFIX + key
    let initial = defaultValue

    try {
        const raw = localStorage.getItem(storageKey)
        if (raw !== null) initial = JSON.parse(raw)
    } catch {
        initial = defaultValue
    }

    const state = ref(initial)

    watch(
        state,
        (value) => {
            try {
                localStorage.setItem(storageKey, JSON.stringify(value))
            } catch {
                // storage may be unavailable (private mode) or full; state stays in-memory only
            }
        },
        { deep: true },
    )

    return state
}
