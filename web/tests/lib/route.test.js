import { describe, expect, it } from 'vitest'
import { mapIdFromPath, pathForMap } from '@/lib/route'

const maps = [{ id: 'erangel' }, { id: 'taego' }]

describe('route', () => {
    it('gives each map its own address', () => {
        expect(pathForMap('taego')).toBe('/taego')
    })

    it('reads the map id from a path, with or without a trailing slash', () => {
        expect(mapIdFromPath('/taego', maps)).toBe('taego')
        expect(mapIdFromPath('/taego/', maps)).toBe('taego')
        expect(mapIdFromPath('/Taego', maps)).toBeNull()
    })

    it('returns null for the home page and for unknown or nested paths', () => {
        expect(mapIdFromPath('/', maps)).toBeNull()
        expect(mapIdFromPath('/nowhere', maps)).toBeNull()
        expect(mapIdFromPath('/taego/extra', maps)).toBeNull()
    })
})
