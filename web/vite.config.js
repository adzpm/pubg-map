import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { seoPages } from './seo/plugin.js'
import { MAPS } from './src/data/maps.js'

export default defineConfig({
    plugins: [
        vue(),
        seoPages(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'PUBG interactive maps',
                short_name: 'PUBG Maps',
                description: 'Interactive PUBG maps: secret rooms, vehicle spawns and a coordinate grid',
                theme_color: '#262a20',
                background_color: '#0d1a22',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                icons: [
                    {
                        src: 'favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,woff2}'],
                // the per-map pages and the 404 page are for first visits and crawlers; once the
                // service worker is in charge every map address is served from the cached app shell
                globIgnores: ['*/index.html', '404.html'],
                // only real pages get the cached shell; any other address goes to the server for its 404
                navigateFallbackAllowlist: [new RegExp(`^/(?:${MAPS.map((m) => m.id).join('|')})?(?:\\?.*)?$`)],
                runtimeCaching: [
                    {
                        urlPattern: /\/assets\/tiles\/.+\.webp(?:\?.*)?$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'pubg-tiles',
                            expiration: {
                                maxEntries: 4000,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        urlPattern: /\/assets\/tiles\/.+\/info\.json$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'pubg-tile-info',
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5180,
        strictPort: true,
    },
})
