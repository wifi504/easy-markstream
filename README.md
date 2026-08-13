# @ezview/markstream

基于 [markstream-vue](https://www.npmjs.com/package/markstream-vue) 的 Vue 3 流式 Markdown 渲染组件：GitHub 浅色观感、代码块流式高亮、Mermaid、KaTeX、链接气泡。

这不是 markstream-vue 官方包，而是带默认皮肤与自定义节点的开箱即用封装。

文档站：https://wifi504.github.io/easy-markstream/

## 安装

```bash
pnpm add @ezview/markstream
```

宿主需要 **Vue `^3.3.0`**。`katex` / `markstream-vue` / `mermaid` / `stream-diffs` 会随本包安装，不必再手装。

## 用法

```vue
<template>
  <easy-markstream :content="md" :final="done" />
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'
</script>
```

组件会自行引入 `markstream-vue` 与 KaTeX 的 CSS。**宿主不要再重复引入。** 若宿主已有 KaTeX，请保证全局只保留一份样式。

### Props

| Prop | 类型 | 说明 |
|---|---|---|
| `content` | `string` | Markdown 文本 |
| `final` | `boolean` | 流式中为 `false`，结束/暂停/跳转快照为 `true` |
| `plainText` | `boolean` | 纯文本模式，默认 `false` |
| `typewriter` | `boolean` | 打字机光标，`final` 时关闭，默认 `true` |
| `showSources` | `boolean` | 文末「来源」，嵌套渲染请传 `false` |
| `floatingUi` | `boolean` | Teleport 浮层，嵌套在浮层内请传 `false` |
| `dark` | `boolean` | 预留，本版无效 |

暂停或未闭合 fence 快照务必 `final=true`。

## 本地开发

本仓库是 pnpm workspace：

```bash
pnpm install
pnpm dev          # playground 流式压力 Demo
pnpm docs:dev     # VitePress 文档站
pnpm build        # 构建 @ezview/markstream
pnpm lint:all
```

## License

MIT
