import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'adz.pm × pubg-maps',
                short_name: 'PUBG Maps',
                description: 'Interactive PUBG maps',
                theme_color: '#212529',
                background_color: '#212529',
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
                runtimeCaching: [
                    {
                        urlPattern: /\/assets\/tiles\/.+\.webp$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'pubg-tiles',
                            expiration: {
                                maxEntries: 4000,
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                            cacheableResponse: {statuses: [0, 200]},
                        },
                    },
                    {
                        urlPattern: /\/assets\/tiles\/.+\/info\.json$/,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'pubg-tile-info',
                            cacheableResponse: {statuses: [0, 200]},
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
