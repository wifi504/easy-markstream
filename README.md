# @ezview/markstream

基于 [markstream-vue](https://www.npmjs.com/package/markstream-vue) 的 Vue 3 流式 Markdown 渲染组件：GitHub 浅色观感、代码块流式高亮、Mermaid、ECharts、KaTeX、链接气泡。

这不是 markstream-vue 官方包，而是带默认皮肤与自定义节点的开箱即用封装。

文档站：https://wifi504.github.io/easy-markstream/

## 安装

```bash
pnpm add @ezview/markstream
```

宿主需要 **Vue `^3.3.0`**。`katex` / `markstream-vue` / `mermaid` / `echarts` / `stream-diffs` 会随本包安装，不必再手装。

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

## 发版

- **CI**：PR 和推 `main` 时跑 lint / type-check / build
- **文档站**：推 `main` 时由 GitHub Pages workflow 部署
- **npm**：只在推 `v*` tag 时发布 `@ezview/markstream`

在 `main` 上把 `packages/markstream/package.json` 的 `version` 改成目标版本并提交，然后：

```bash
git tag v0.1.0
git push origin v0.1.0
```

tag 必须与包版本一致（`v0.1.0` → `0.1.0`）。

npm 包设置里配置 **Trusted Publisher**：GitHub 仓库 `wifi504/easy-markstream`，workflow 文件名 `publish.yml`。第一次发 `0.1.0` 在仓库根目录执行（强制官方源，避开镜像）：

```bash
pnpm publish:only
```

之后在 npm 绑定 Trusted Publisher，后续发版走 tag 即可。

## License

MIT。本包依赖 [markstream-vue](https://github.com/Simon-He95/markstream-vue)，Copyright (c) 2022 Simon He，MIT。
