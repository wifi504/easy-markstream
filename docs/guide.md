# 安装与用法

## 安装

```bash
pnpm add @ezview/markstream
```

只需这一条。`katex`、`markstream-vue`、`mermaid`、`stream-diffs` 会随包安装。宿主必须已有 **Vue `^3.3.0`**。

## 用法

```vue
<template>
  <easy-markstream :content="md" :final="done" />
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'
import { ref } from 'vue'

const md = ref('# Hello')
const done = ref(true)
</script>
```

组件会自行引入 `markstream-vue/index.css` 与 `katex/dist/katex.min.css`。**宿主不要再重复引入。** 若宿主已有 KaTeX，请保证全局只保留一份样式。

## Props

| Prop | 类型 | 说明 |
|---|---|---|
| `content` | `string` | Markdown 文本 |
| `final` | `boolean` | 对齐 markstream：流式中为 `false`，结束/暂停/跳转快照为 `true` |
| `plainText` | `boolean` | 纯文本模式：全部挤进一个 `<p>`；单换行→两空格，连续换行→字面量 ` \| `；强制不显示光标；默认 `false` |
| `typewriter` | `boolean` | 打字机光标；`final` 时强制关闭（默认 `true`） |
| `showSources` | `boolean` | `final` 时是否展示文末「来源」；嵌套渲染请传 `false`（默认 `true`） |
| `floatingUi` | `boolean` | 是否允许 Teleport 浮层；嵌套在浮层内请传 `false`（默认 `true`） |
| `dark` | `boolean` | **预留，本版无效**（始终浅色 GitHub 主题） |

暂停、拖坐标或任何「未闭合 fence」快照场景，务必 `final=true`，否则可能出现节点重复。

## 服务端渲染

本组件只能在浏览器里运行。如果项目会先在服务端出 HTML（例如 Nuxt），请把组件包在 `ClientOnly` 里。
