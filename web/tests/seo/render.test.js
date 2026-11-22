import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { MAPS } from '@/data/maps'
import { pageMeta } from '@/lib/seo'
import {
    escapeHtml,
    renderBody,
    renderHead,
    renderNotFound,
    renderPage,
    renderRobots,
    renderSitemap,
} from '../../seo/render.js'

const file = (relative) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..', relative)
const template = readFileSync(file('index.html'), 'utf8')
const parse = (html) => new DOMParser().parseFromString(html, 'text/html')
const erangel = pageMeta(MAPS.find((m) => m.id === 'erangel'))

describe('renderHead', () => {
    it('writes the title, description, canonical address and preview image of the page', () => {
        const doc = parse(`<head>${renderHead(erangel)}</head>`)

        expect(doc.title).toBe(erangel.title)
        expect(doc.querySelector('meta[name="description"]').content).toBe(erangel.description)
        expect(doc.querySelector('link[rel="canonical"]').getAttribute('href')).toBe('https://pubg.adz.pm/erangel')
        expect(doc.querySelector('meta[property="og:image"]').content).toBe('https://pubg.adz.pm/og/erangel.jpg')
    })

    it('carries valid structured data, with a breadcrumb only on map pages', () => {
        const types = (meta) =>
            JSON.parse(parse(renderHead(meta)).querySelector('script[type="application/ld+json"]').textContent)[
                '@graph'
            ].map((node) => node['@type'])

        expect(types(erangel)).toEqual(['WebSite', 'WebPage', 'BreadcrumbList'])
        expect(types(pageMeta(null))).toEqual(['WebSite', 'WebPage'])
    })

    it('escapes text', () => {
        expect(escapeHtml('a "b" <c> & d')).toBe('a &quot;b&quot; &lt;c&gt; &amp; d')
        expect(renderHead({ ...erangel, title: '</title><script>' })).not.toContain('</title><script>')
    })
})

describe('renderBody', () => {
    it('gives a map page a heading, its facts and links to every other page', () => {
        const doc = parse(renderBody(erangel))

        expect(doc.querySelector('h1').textContent).toBe('Erangel map')
        expect(doc.body.textContent).toContain(`${erangel.facts.secrets} secret rooms`)
        expect(doc.body.textContent).toContain(`${erangel.facts.vehicleSpots} vehicle spawn points`)
        expect([...doc.querySelectorAll('nav a')].map((a) => a.getAttribute('href'))).toEqual([
            '/',
            ...MAPS.map((m) => `/${m.id}`),
        ])
        expect(doc.querySelector('[aria-current="page"]').getAttribute('href')).toBe('/erangel')
    })

    it('lists every map on the home page', () => {
        const doc = parse(renderBody(pageMeta(null)))

        expect([...doc.querySelectorAll('li a')].map((a) => a.getAttribute('href'))).toEqual(
            MAPS.map((m) => `/${m.id}`),
        )
    })
})

describe('renderPage', () => {
    it('fills index.html and can refill a filled page for another map', () => {
        const home = renderPage(template, pageMeta(null))
        const page = parse(renderPage(home, erangel))

        expect(parse(home).title).toBe(pageMeta(null).title)
        expect(page.title).toBe(erangel.title)
        expect(page.querySelectorAll('title')).toHaveLength(1)
        expect(page.querySelectorAll('h1')).toHaveLength(1)
        expect(page.querySelector('#app h1').textContent).toBe('Erangel map')
    })

    it('refuses a template without the regions', () => {
        expect(() => renderPage('<html></html>', erangel)).toThrow(/seo:head/)
    })
})

describe('site files', () => {
    it('lists every page once in the sitemap and points robots.txt at it', () => {
        const locs = [...renderSitemap().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

        expect(locs).toEqual(['https://pubg.adz.pm/', ...MAPS.map((m) => `https://pubg.adz.pm/${m.id}`)])
        expect(renderRobots()).toContain('Sitemap: https://pubg.adz.pm/sitemap.xml')
    })

    it('keeps the 404 page out of the index and free of the app', () => {
        const doc = parse(renderNotFound())

        expect(doc.querySelector('meta[name="robots"]').content).toBe('noindex')
        expect(doc.querySelector('script')).toBeNull()
        expect(doc.querySelectorAll('nav a')).toHaveLength(MAPS.length + 1)
    })

    it('has a preview image for every map', () => {
        for (const map of MAPS) expect(existsSync(file(`public/og/${map.id}.jpg`)), map.id).toBe(true)
    })
})
