import { absoluteUrl } from './seo.js'

const set = (selector, attr, value) => document.head.querySelector(selector)?.setAttribute(attr, value)

/** Bring the document head in line with the page shown; the static pages carry the same values. */
export const applyPageMeta = (meta) => {
    const url = absoluteUrl(meta.path)
    document.title = meta.title
    set('meta[name="description"]', 'content', meta.description)
    set('link[rel="canonical"]', 'href', url)
    set('meta[property="og:title"]', 'content', meta.title)
    set('meta[property="og:description"]', 'content', meta.description)
    set('meta[property="og:url"]', 'content', url)
    set('meta[property="og:image"]', 'content', absoluteUrl(meta.image))
}
