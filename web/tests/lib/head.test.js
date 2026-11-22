import { describe, expect, it } from 'vitest'
import { applyPageMeta } from '@/lib/head'

const meta = { path: '/taego', title: 'T', description: 'D', image: '/og/taego.jpg' }
const attr = (selector, name) => document.head.querySelector(selector).getAttribute(name)

describe('applyPageMeta', () => {
    it('updates the title and the tags the static page carries', () => {
        document.head.innerHTML = `
            <meta name="description" content="" /><link rel="canonical" href="" />
            <meta property="og:title" content="" /><meta property="og:description" content="" />
            <meta property="og:url" content="" /><meta property="og:image" content="" />`

        applyPageMeta(meta)

        expect(document.title).toBe('T')
        expect(attr('meta[name="description"]', 'content')).toBe('D')
        expect(attr('link[rel="canonical"]', 'href')).toBe('https://pubg.adz.pm/taego')
        expect(attr('meta[property="og:title"]', 'content')).toBe('T')
        expect(attr('meta[property="og:description"]', 'content')).toBe('D')
        expect(attr('meta[property="og:url"]', 'content')).toBe('https://pubg.adz.pm/taego')
        expect(attr('meta[property="og:image"]', 'content')).toBe('https://pubg.adz.pm/og/taego.jpg')
    })

    it('still sets the title when the tags are missing', () => {
        document.head.innerHTML = ''

        expect(() => applyPageMeta(meta)).not.toThrow()
        expect(document.title).toBe('T')
    })
})
