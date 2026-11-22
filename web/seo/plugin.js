import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { MAPS } from '../src/data/maps.js'
import { pageMeta } from '../src/lib/seo.js'
import { renderLlms, renderNotFound, renderPage, renderRobots, renderSitemap } from './render.js'

/**
 * Gives every map a static page of its own (dist/<id>/index.html) with its title, description and
 * text, next to a sitemap, robots.txt and a 404 page. The app is the same bundle on all of them.
 */
export const seoPages = () => {
    let outDir = 'dist'
    return {
        name: 'seo-pages',
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir)
        },
        transformIndexHtml: {
            order: 'pre',
            handler: (html) => renderPage(html, pageMeta(null)),
        },
        async writeBundle() {
            const home = await readFile(path.join(outDir, 'index.html'), 'utf8')
            for (const map of MAPS) {
                await mkdir(path.join(outDir, map.id), { recursive: true })
                await writeFile(path.join(outDir, map.id, 'index.html'), renderPage(home, pageMeta(map)))
            }
            await writeFile(path.join(outDir, 'sitemap.xml'), renderSitemap())
            await writeFile(path.join(outDir, 'robots.txt'), renderRobots())
            await writeFile(path.join(outDir, 'llms.txt'), renderLlms())
            await writeFile(path.join(outDir, '404.html'), renderNotFound())
        },
    }
}
