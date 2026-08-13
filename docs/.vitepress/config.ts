import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  title: '@ezview/markstream',
  description: 'Vue 3 开箱即用的流式 Markdown 渲染组件，基于 markstream-vue。',
  lang: 'zh-CN',
  base: '/easy-markstream/',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide' },
      { text: '演示', link: '/demo' },
    ],
    sidebar: [
      {
        text: '开始',
        items: [
          { text: '简介', link: '/' },
          { text: '安装与用法', link: '/guide' },
          { text: '现场演示', link: '/demo' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/wifi504/easy-markstream' },
    ],
    outline: 'deep',
  },
  vite: {
    resolve: {
      alias: {
        '@ezview/markstream': resolve(root, '../../packages/markstream/src/index.ts'),
      },
      dedupe: ['vue'],
    },
    server: {
      fs: {
        allow: [resolve(root, '../..')],
      },
    },
  },
})
