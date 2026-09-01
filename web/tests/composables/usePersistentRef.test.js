import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { usePersistentRef } from '@/composables/usePersistentRef'

describe('usePersistentRef', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('falls back to the default when storage is empty', () => {
        expect(usePersistentRef('missing', 'fallback').value).toBe('fallback')
    })

    it('reads an existing value stored under the pubg-map: prefix', () => {
        localStorage.setItem('pubg-map:mapId', JSON.stringify('vikendi'))
        expect(usePersistentRef('mapId', 'erangel').value).toBe('vikendi')
    })

    it('ignores values stored under the unprefixed key', () => {
        localStorage.setItem('mapId', JSON.stringify('vikendi'))
        expect(usePersistentRef('mapId', 'erangel').value).toBe('erangel')
    })

    it('still reads falsy stored values instead of the default', () => {
        localStorage.setItem('pubg-map:flag', JSON.stringify(false))
        expect(usePersistentRef('flag', true).value).toBe(false)

        localStorage.setItem('pubg-map:count', JSON.stringify(0))
        expect(usePersistentRef('count', 7).value).toBe(0)
    })

    it('persists assignments under the prefixed key', async () => {
        const state = usePersistentRef('mapId', 'erangel')
        state.value = 'taego'
        await nextTick()

        expect(localStorage.getItem('pubg-map:mapId')).toBe(JSON.stringify('taego'))
        expect(localStorage.getItem('mapId')).toBeNull()
    })

    it('does not write anything until the value changes', () => {
        usePersistentRef('untouched', 'default')
        expect(localStorage.getItem('pubg-map:untouched')).toBeNull()
    })

    it('persists deep mutations of object values', async () => {
        const state = usePersistentRef('cursor', { x: 1, y: 2 })
        state.value.y = 99
        await nextTick()

        expect(JSON.parse(localStorage.getItem('pubg-map:cursor'))).toEqual({ x: 1, y: 99 })
    })

    it('survives corrupt JSON in storage by using the default', () => {
        localStorage.setItem('pubg-map:broken', '{not json')
        expect(usePersistentRef('broken', 'fallback').value).toBe('fallback')
    })
})
