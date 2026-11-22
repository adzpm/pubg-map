import { describe, expect, it } from 'vitest'
import { MAPS } from '@/data/maps'
import { SECRET_ROOMS } from '@/data/secrets'
import { VEHICLES } from '@/data/vehicles'
import { absoluteUrl, mapFacts, pageMeta } from '@/lib/seo'

const map = (id) => MAPS.find((m) => m.id === id)

describe('mapFacts', () => {
    it('counts what the layers of the map draw', () => {
        const facts = mapFacts(map('erangel'))

        expect(facts.size).toBe('8×8 km')
        expect(facts.secrets).toBe(SECRET_ROOMS.erangel.length)
        expect(facts.vehicleSpots).toBe(VEHICLES.erangel.spots.length)
        expect(facts.fixedSpots).toBeGreaterThan(0)
        expect(facts.fixedSpots).toBeLessThan(facts.vehicleSpots)
        expect(new Set(facts.vehicles).size).toBe(facts.vehicles.length)
    })

    it('reports zeros for a map without rooms or vehicles', () => {
        expect(mapFacts(map('karakin'))).toMatchObject({ secrets: 0, vehicleSpots: 0, fixedSpots: 0, vehicles: [] })
    })
})

describe('pageMeta', () => {
    it('names the map and only the layers it has', () => {
        expect(pageMeta(map('erangel')).title).toBe('PUBG Erangel map: secret rooms, vehicle spawns and grid')
        expect(pageMeta(map('sanhok')).title).toBe('PUBG Sanhok map: vehicle spawns and grid')
        expect(pageMeta(map('karakin')).title).toBe('PUBG Karakin interactive map with grid')
        expect(pageMeta(map('karakin')).description).not.toMatch(/secret|vehicle/)
    })

    it('gives every page a distinct title and description that fit a search result', () => {
        const pages = [pageMeta(null), ...MAPS.map((m) => pageMeta(m))]

        expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length)
        expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length)
        for (const page of pages) {
            expect(page.title.length, page.title).toBeLessThanOrEqual(60)
            expect(page.description.length, page.description).toBeLessThanOrEqual(220)
            expect(page.about, page.path).not.toBe('')
        }
    })

    it('describes the whole site on the home page', () => {
        const home = pageMeta(null)

        expect(home.path).toBe('/')
        expect(home.description).toContain('Erangel')
        expect(home.description).toContain('Karakin')
        expect(absoluteUrl(home.path)).toBe('https://pubg.adz.pm/')
    })
})
