import { describe, expect, it, vi } from 'vitest'
import L from 'leaflet'
import {
    buildVehiclesLayer,
    chanceLabel,
    describeGroup,
    isGuaranteed,
    unplacedVehicles,
    vehicleSpotCount,
} from '@/lib/vehicles'

vi.mock('@/data/vehicles', () => ({
    VEHICLES: {
        testmap: {
            groups: [
                {
                    name: 'Road',
                    kind: 'land',
                    fixed: false,
                    chance: 34.4,
                    count: 143,
                    spots: 416,
                    vehicles: ['Uaz', 'Dacia'],
                },
                {
                    name: 'Esports Water',
                    kind: 'water',
                    fixed: true,
                    chance: 100,
                    count: 23,
                    spots: 23,
                    vehicles: ['Boat <PG117>'],
                },
                { name: 'Start', kind: 'land', fixed: false, chance: 20.9, count: [8, 10], spots: 43, vehicles: [] },
            ],
            unplaced: [
                { name: 'Garage', count: 8, vehicles: ['Dacia'] },
                { name: 'Offroad', count: [4, 8], vehicles: ['Buggy'] },
            ],
            spots: [
                [10, 20, 0],
                [30, 40, 1],
                [50, 60, 2],
                [70, 80, 9],
            ],
        },
    },
}))

const toLL = (x, y) => L.latLng(y, x)
const group = (over) => ({
    name: 'G',
    kind: 'land',
    fixed: false,
    chance: 50,
    count: 5,
    spots: 10,
    vehicles: [],
    ...over,
})

describe('chanceLabel', () => {
    it('rounds to a whole percent', () => {
        expect(chanceLabel(group({ chance: 34.4 }))).toBe('34')
        expect(chanceLabel(group({ chance: 66.7 }))).toBe('67')
    })

    it('never shows 0 for a spot that can spawn, or 100 for one that can miss', () => {
        expect(chanceLabel(group({ chance: 0.3 }))).toBe('1')
        expect(chanceLabel(group({ chance: 99.6 }))).toBe('99')
        expect(chanceLabel(group({ chance: 100 }))).toBe('100')
    })
})

describe('describeGroup', () => {
    it('spells out the odds as count of spots', () => {
        const road = group({ name: 'Road', chance: 34.4, count: 143, spots: 416, vehicles: ['Uaz', 'Dacia'] })

        expect(describeGroup(road)).toEqual([
            'Road',
            'About 34% each: 143 vehicles per match across 416 points',
            'Uaz, Dacia',
        ])
    })

    it('shows a count range and drops an empty vehicle list', () => {
        const start = group({ chance: 20.9, count: [8, 10], spots: 43 })

        expect(describeGroup(start)[1]).toBe('About 21% each: 8–10 vehicles per match across 43 points')
        expect(describeGroup(start)).toHaveLength(2)
    })

    it('says so when every spot spawns', () => {
        const fixed = group({ chance: 100, count: 23, spots: 23 })

        expect(isGuaranteed(fixed)).toBe(true)
        expect(describeGroup(fixed)[1]).toBe('Fixed spawn: a vehicle on each of these 23 points every match')
    })
})

describe('unplacedVehicles', () => {
    it('lists table rows that have no points on the map', () => {
        expect(unplacedVehicles('testmap')).toEqual(['Garage (8 per match)', 'Offroad (4–8 per match)'])
        expect(unplacedVehicles('nowhere')).toEqual([])
    })
})

describe('buildVehiclesLayer', () => {
    const markers = () => buildVehiclesLayer('testmap', toLL).getLayers()
    const at = (x, y) => markers().find((m) => m.getLatLng().equals(toLL(x, y)))

    it('creates a marker per spot and skips spots whose group is missing', () => {
        expect(markers()).toHaveLength(3)
        expect(vehicleSpotCount('testmap')).toBe(4)
        expect(vehicleSpotCount('nowhere')).toBe(0)
    })

    it('writes the chance on the chip and marks the kind and guaranteed spots', () => {
        expect(at(10, 20).options.icon.options.html).toBe('<div class="vehicle-spot land">34</div>')
        expect(at(30, 40).options.icon.options.html).toBe('<div class="vehicle-spot water guaranteed">100</div>')
    })

    it('escapes tooltip text', () => {
        expect(at(30, 40).getTooltip().getContent()).toContain('Boat &#60;PG117&#62;')
    })

    it('returns an empty layer for maps without vehicles', () => {
        expect(buildVehiclesLayer('nowhere', toLL).getLayers()).toHaveLength(0)
    })
})
