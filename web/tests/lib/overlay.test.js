import { describe, expect, it } from 'vitest'
import { isOverlay } from '@/lib/overlay'

describe('isOverlay', () => {
    it('recognises the Electron overlay by its user agent', () => {
        const ua =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) pubg-map-overlay/0.1.4 Chrome/140.0.0.0 Electron/45.4.1 Safari/537.36'
        expect(isOverlay(ua)).toBe(true)
    })

    it('is false in a regular browser', () => {
        expect(isOverlay('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36')).toBe(false)
        expect(isOverlay()).toBe(false)
    })
})
