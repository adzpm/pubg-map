import { afterEach, describe, expect, it, vi } from 'vitest'
import { TILE_SIZE, tileUrlTemplate, tileInfoUrl, computeMaxNativeZoom, fetchTileInfo } from '@/lib/tiles'

describe('TILE_SIZE', () => {
    it('matches the 256px tiles produced by scripts/build-tiles.sh', () => {
        expect(TILE_SIZE).toBe(256)
    })
})

describe('computeMaxNativeZoom', () => {
    it('is 0 when the image fits a single tile exactly', () => {
        expect(computeMaxNativeZoom(256, 256)).toBe(0)
    })

    it('rounds up as soon as the image exceeds one tile', () => {
        expect(computeMaxNativeZoom(257, 257)).toBe(1)
        expect(computeMaxNativeZoom(257, 100)).toBe(1)
    })

    it('is exact for power-of-two multiples of the tile size', () => {
        expect(computeMaxNativeZoom(512, 512)).toBe(1)
        expect(computeMaxNativeZoom(4096, 4096)).toBe(4)
        expect(computeMaxNativeZoom(8192, 8192)).toBe(5)
    })

    it('uses the larger side for non-square images', () => {
        expect(computeMaxNativeZoom(8192, 256)).toBe(5)
        expect(computeMaxNativeZoom(300, 4096)).toBe(4)
    })
})

describe('tile URLs', () => {
    it('builds the {z}/{y}/{x} template relative to BASE_URL', () => {
        expect(import.meta.env.BASE_URL).toBe('/')
        expect(tileUrlTemplate('erangel')).toBe('/assets/tiles/erangel/{z}/{y}/{x}.webp')
        expect(tileUrlTemplate('erangel').startsWith(import.meta.env.BASE_URL)).toBe(true)
    })

    it('points info.json inside the same tile directory', () => {
        expect(tileInfoUrl('taego')).toBe('/assets/tiles/taego/info.json')
        expect(tileInfoUrl('taego').startsWith(import.meta.env.BASE_URL)).toBe(true)
    })
})

describe('fetchTileInfo', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('resolves with the parsed dimensions using a cache-friendly request', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ width: 4096, height: 2048 }),
        })
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchTileInfo('erangel')).resolves.toEqual({ width: 4096, height: 2048 })
        expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/assets/tiles/erangel/info.json', { cache: 'force-cache' })
    })

    it('rejects with a hint naming the map when tiles are missing', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

        await expect(fetchTileInfo('sanhok')).rejects.toThrow('Tiles for "sanhok" not found')
        await expect(fetchTileInfo('sanhok')).rejects.toThrow(/build-tiles\.sh/)
    })
})
