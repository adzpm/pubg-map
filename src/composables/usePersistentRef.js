import {ref, watch} from 'vue'

const PREFIX = 'pubg-map:'

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

    watch(state, (value) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(value))
        } catch {
        }
    }, {deep: true})

    return state
}
