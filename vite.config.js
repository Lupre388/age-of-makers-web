import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Age of Makers',
        short_name: 'AoM',
        description: 'Inspire youth to become independent learners solving the world\'s biggest challenges using their creativity & new technology.',
        theme_color: '#2c3e50',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/images/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,yaml,mp3,ttf,woff,woff2,eot}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1200
  }
})
