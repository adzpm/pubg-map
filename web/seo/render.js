// Static HTML for search engines and link previews: the head of every page, the text shown until
// the app starts (and to anything that does not run JavaScript), the sitemap and the 404 page.
import { MAPS } from '../src/data/maps.js'
import { SITE_NAME, SITE_URL, absoluteUrl, pageMeta } from '../src/lib/seo.js'
import { pathForMap } from '../src/lib/route.js'

const GAME = 'PUBG: BATTLEGROUNDS'

export const escapeHtml = (text) =>
    String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// "<" must not appear raw inside a script element
const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

const structuredData = (meta) => {
    const url = absoluteUrl(meta.path)
    const graph = [
        { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, url: `${SITE_URL}/`, name: SITE_NAME },
        {
            '@type': 'WebPage',
            '@id': `${url}#page`,
            url,
            name: meta.title,
            description: meta.description,
            primaryImageOfPage: absoluteUrl(meta.image),
            isAccessibleForFree: true,
            isPartOf: { '@id': `${SITE_URL}/#site` },
            about: { '@type': 'VideoGame', name: GAME },
        },
    ]
    if (meta.id) {
        graph.push({
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: meta.heading, item: url },
            ],
        })
    }
    return { '@context': 'https://schema.org', '@graph': graph }
}

export const renderHead = (meta) => {
    const url = absoluteUrl(meta.path)
    const image = absoluteUrl(meta.image)
    return [
        `<title>${escapeHtml(meta.title)}</title>`,
        `<meta name="description" content="${escapeHtml(meta.description)}" />`,
        `<link rel="canonical" href="${url}" />`,
        '<meta name="robots" content="index, follow, max-image-preview:large" />',
        '<meta property="og:type" content="website" />',
        `<meta property="og:site_name" content="${SITE_NAME}" />`,
        `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
        `<meta property="og:url" content="${url}" />`,
        `<meta property="og:image" content="${image}" />`,
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        `<script type="application/ld+json">${jsonLd(structuredData(meta))}</script>`,
    ].join('\n        ')
}

const link = (href, text, current) =>
    `<a href="${href}"${current ? ' aria-current="page"' : ''}>${escapeHtml(text)}</a>`

/** The text a page shows before the app starts; the app shows the same text in its window. */
export const renderBody = (meta) =>
    [
        '<div class="intro">',
        `<h1>${escapeHtml(meta.heading)}</h1>`,
        `<p>${escapeHtml(meta.about)}</p>`,
        '<ul>',
        ...meta.lines.map((line) =>
            line.href
                ? `<li>${link(line.href, line.label)}: ${escapeHtml(line.text)}</li>`
                : `<li>${escapeHtml(line.text)}</li>`,
        ),
        '</ul>',
        ...meta.sections.flatMap((section) => [
            `<h2>${escapeHtml(section.heading)}</h2>`,
            '<ul>',
            ...section.lines.map((line) => `<li>${escapeHtml(line.text)}</li>`),
            '</ul>',
        ]),
        '<nav aria-label="Maps">',
        link('/', 'All maps', !meta.id),
        ...MAPS.map((m) => link(pathForMap(m.id), m.name, m.id === meta.id)),
        '</nav>',
        '<noscript><p>The map itself needs JavaScript.</p></noscript>',
        '</div>',
    ].join('\n            ')

const region = (name) => new RegExp(`(<!--seo:${name}-->)[\\s\\S]*?(<!--/seo:${name}-->)`)

/** Fill the head and body regions of index.html for one page. Works on an already filled page too. */
export const renderPage = (template, meta) => {
    for (const name of ['head', 'body']) {
        if (!region(name).test(template)) throw new Error(`index.html has no seo:${name} region`)
    }
    return template
        .replace(region('head'), (_, open, close) => `${open}\n        ${renderHead(meta)}\n        ${close}`)
        .replace(region('body'), (_, open, close) => `${open}\n            ${renderBody(meta)}\n            ${close}`)
}

export const pages = () => [pageMeta(null), ...MAPS.map((m) => pageMeta(m))]

// no lastmod: the only date known at build time is the build's, and a date that changes without
// the page changing teaches crawlers to ignore it
export const renderSitemap = () =>
    [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
        ...pages().map(
            (p) =>
                `  <url><loc>${absoluteUrl(p.path)}</loc>` +
                `<image:image><image:loc>${absoluteUrl(p.image)}</image:loc></image:image></url>`,
        ),
        '</urlset>',
        '',
    ].join('\n')

/** A plain-text summary for language-model crawlers (llmstxt.org). */
export const renderLlms = () =>
    [
        `# ${SITE_NAME}`,
        '',
        `> ${pageMeta(null).about} Free, no sign-up, no ads.`,
        '',
        '## Maps',
        '',
        ...pages()
            .filter((p) => p.id)
            .map((p) => `- [${p.heading}](${absoluteUrl(p.path)}): ${p.description}`),
        '',
        '## Data',
        '',
        '- Map imagery, secret rooms and vehicle spawn points come from the game files; spawn chances are estimates (vehicles per match divided by spawn points).',
        '',
    ].join('\n')

export const renderRobots = () => ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n')

/** A standalone page: the app must not start on an address that does not exist. */
export const renderNotFound = () => `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#262a20" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>Page not found | ${SITE_NAME}</title>
        <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0d1a22; color: #e2d6b4; font: 16px/1.5 system-ui, sans-serif; }
            main { max-width: 34rem; padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 28px; }
            a { color: #ff7438; }
            nav { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 16px; }
        </style>
    </head>
    <body>
        <main>
            <h1>There is no page at this address</h1>
            <p>Pick a map instead:</p>
            <nav aria-label="Maps">
                ${[link('/', 'All maps'), ...MAPS.map((m) => link(pathForMap(m.id), m.name))].join('\n                ')}
            </nav>
        </main>
    </body>
</html>
`
