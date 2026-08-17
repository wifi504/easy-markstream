import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

const root = dirname(fileURLToPath(import.meta.url))

const externals = [
  'vue',
  'katex',
  'markstream-vue',
  'mermaid',
  'echarts',
  'stream-diffs',
]

export default defineConfig({
  plugins: [
    vue(),
    libInjectCss(),
    dts({
      tsconfigPath: resolve(root, 'tsconfig.json'),
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/env.d.ts'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(root, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: (id) => {
        return externals.some(pkg => id === pkg || id.startsWith(`${pkg}/`))
      },
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: true,
    emptyOutDir: true,
  },
})
