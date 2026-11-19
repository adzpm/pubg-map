import { describe, expect, it } from 'vitest'
import { buildMap } from '../../../scripts/build-vehicles.mjs'

const spot = (x, y, group, mode) => ({
    x,
    y,
    z: 0,
    level: 'l',
    tag: 'VehicleSpot',
    group,
    ...(mode ? { mode } : {}),
})
const rule = (category, count, vehicles = []) => ({ categories: [category], count, fuel: [40, 100], vehicles })
const dump = (vehicles, groups) => ({ extent: 816000, layers: { vehicles }, vehicleRules: { br: { groups } } })
const many = (n, group) => Array.from({ length: n }, (_, i) => spot(i, i, group))

describe('buildMap', () => {
    it('gives each spot of a group the chance count / spots and converts cm to pixels', () => {
        const map = buildMap(
            dump([spot(408000, 204000, 'Default'), ...many(3, 'Default')], { A: [rule('Road', [1, 1], ['Uaz'])] }),
        )

        expect(map.groups).toEqual([
            { name: 'Road', kind: 'land', fixed: false, chance: 25, count: 1, spots: 4, vehicles: ['Uaz'] },
        ])
        expect(map.spots).toContainEqual([4096, 2048, 0])
    })

    it('uses the middle of a count range and keeps the range', () => {
        const [group] = buildMap(dump(many(40, 'B'), { B: [rule('Start', [8, 10])] })).groups

        expect(group.chance).toBe(22.5)
        expect(group.count).toEqual([8, 10])
    })

    it('marks esports groups as fixed and caps the chance at 100', () => {
        const [group] = buildMap(dump(many(10, 'L'), { L: [rule('EsportsWater', [11, 11], ['Boat PG117'])] })).groups

        expect(group).toMatchObject({ fixed: true, kind: 'water', chance: 100 })
    })

    it('classifies gliders as air', () => {
        const [group] = buildMap(dump(many(1, 'O'), { O: [rule('Motorglider', [1, 1], ['Motorglider'])] })).groups

        expect(group.kind).toBe('air')
    })

    it('leaves out Intense BR spots, groups with no rule, rules with no spots and zero counts', () => {
        const spots = [spot(1, 1, 'Default', 'IBR'), spot(2, 2, 'K'), spot(3, 3, 'E'), spot(4, 4, null, 'IBR')]
        const map = buildMap(
            dump(spots, { A: [rule('Road', [5, 5])], C: [rule('Garage', [8, 8])], E: [rule('Water', [0, 0])] }),
        )

        expect(map).toEqual({ groups: [], spots: [] })
    })

    it('adds up the live rules on one letter and ignores its zero-count ones', () => {
        const rules = { E: [rule('Water', [0, 0], ['Boat PG117']), rule('Picobus', [23, 23], ['Pico Bus'])] }
        const [group] = buildMap(dump(many(46, 'E'), rules)).groups

        expect(group).toMatchObject({ name: 'Picobus', kind: 'land', chance: 50, vehicles: ['Pico Bus'] })
    })
})
