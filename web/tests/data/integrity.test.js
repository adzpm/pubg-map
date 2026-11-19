import { describe, expect, it } from 'vitest'
import { MAPS } from '@/data/maps'
import { SECRET_ROOMS } from '@/data/secrets'
import { VEHICLES } from '@/data/vehicles'

describe('MAPS data', () => {
    it('has at least one map', () => {
        expect(MAPS.length).toBeGreaterThan(0)
    })

    it('gives every map a unique non-empty id', () => {
        for (const map of MAPS) {
            expect(map.id, JSON.stringify(map)).toBeTypeOf('string')
            expect(map.id).not.toBe('')
        }
        expect(new Set(MAPS.map((m) => m.id)).size).toBe(MAPS.length)
    })

    it('gives every map a non-empty name', () => {
        for (const map of MAPS) {
            expect(map.name, `map ${map.id}`).toBeTypeOf('string')
            expect(map.name.trim()).not.toBe('')
        }
    })

    it('gives every map positive integer grid cells', () => {
        for (const map of MAPS) {
            for (const axis of ['x', 'y']) {
                const value = map.cells?.[axis]
                expect(Number.isInteger(value), `map ${map.id} cells.${axis} = ${value}`).toBe(true)
                expect(value).toBeGreaterThan(0)
            }
        }
    })
})

describe('SECRET_ROOMS data', () => {
    it('only references known map ids', () => {
        const knownIds = new Set(MAPS.map((m) => m.id))
        const unknown = Object.keys(SECRET_ROOMS).filter((id) => !knownIds.has(id))
        expect(unknown).toEqual([])
    })

    it('stores an array of points per map', () => {
        for (const [mapId, points] of Object.entries(SECRET_ROOMS)) {
            expect(Array.isArray(points), `SECRET_ROOMS.${mapId}`).toBe(true)
        }
    })

    // guards against bare `{}` / typo'd entries that would be silently dropped by buildSecretRoomsLayer
    it('gives every point finite numeric coordinates greater than zero', () => {
        const isValidCoord = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0
        const bad = []

        for (const [mapId, points] of Object.entries(SECRET_ROOMS)) {
            points.forEach((point, index) => {
                if (!point || !isValidCoord(point.x) || !isValidCoord(point.y)) {
                    bad.push(`${mapId}[${index}]: ${JSON.stringify(point)}`)
                }
            })
        }

        expect(bad).toEqual([])
    })
})

describe('VEHICLES data', () => {
    it('only references known map ids', () => {
        const knownIds = new Set(MAPS.map((m) => m.id))
        expect(Object.keys(VEHICLES).filter((id) => !knownIds.has(id))).toEqual([])
    })

    it('keeps every spot inside the image and pointing at an existing group', () => {
        const bad = []
        for (const [mapId, { groups, spots }] of Object.entries(VEHICLES)) {
            spots.forEach(([x, y, g], index) => {
                const inside = x >= 0 && x <= 8192 && y >= 0 && y <= 8192
                if (!inside || !groups[g]) bad.push(`${mapId}[${index}]: ${x},${y},${g}`)
            })
        }
        expect(bad).toEqual([])
    })

    it('has as many spots per group as the group says, and a chance that follows from count / spots', () => {
        for (const [mapId, { groups, spots }] of Object.entries(VEHICLES)) {
            groups.forEach((group, g) => {
                const label = `${mapId} ${group.name}`
                expect(spots.filter((s) => s[2] === g).length, label).toBe(group.spots)

                const [min, max] = Array.isArray(group.count) ? group.count : [group.count, group.count]
                const expected = Math.min(100, (100 * (min + max)) / 2 / group.spots)
                expect(Math.abs(group.chance - expected), label).toBeLessThan(0.06)
                expect(['land', 'water', 'air'], label).toContain(group.kind)
            })
        }
    })
})
