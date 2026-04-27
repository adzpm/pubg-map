import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    server: {
        host: '0.0.0.0',
        port: 5180,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        assetsInlineLimit: 0,
    },
    publicDir: 'public',
})
