import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// A header-only release must also refresh cached HTML responses in existing PWAs.
const securityPolicyRevision = createHash('sha256').update(readFileSync(new URL('./public/_headers', import.meta.url))).digest('hex')

export default defineConfig({
  base: '/',
  plugins: [vue(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      name: 'BonusTrack 加碼額度追蹤', short_name: 'BonusTrack', description: '查看剩餘可刷額度，快速記錄消費。',
      lang: 'zh-Hant', theme_color: '#16705a', background_color: '#f5f7f5', display: 'standalone', start_url: './', scope: './',
      icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
    },
    workbox: { cacheId: `bonus-track-${securityPolicyRevision}`, globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'], cleanupOutdatedCaches: true, navigateFallback: 'index.html' },
  })],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
