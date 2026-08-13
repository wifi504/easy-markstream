import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ezview/markstream': resolve(root, '../packages/markstream/src/index.ts'),
    },
    dedupe: ['vue'],
  },
  server: {
    fs: {
      allow: [resolve(root, '..')],
    },
  },
})
