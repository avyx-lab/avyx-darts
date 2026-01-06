import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: {
        alias: {
            '@avyx/core': path.resolve(__dirname, '../00_avyx-core/src/index.ts'),
        },
    },
    server: {
        port: 5176,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
})
