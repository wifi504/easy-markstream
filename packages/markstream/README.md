# @ezview/markstream

基于 [markstream-vue](https://www.npmjs.com/package/markstream-vue) 的 Vue 3 流式 Markdown 渲染组件：GitHub 浅色观感、代码块流式高亮、Mermaid、ECharts、KaTeX、链接气泡。

这不是 markstream-vue 官方包，而是带默认皮肤与自定义节点的开箱即用封装。

文档站：https://wifi504.github.io/easy-markstream/

## 安装

```bash
pnpm add @ezview/markstream
```

宿主需要 **Vue `^3.3.0`**。`katex` / `markstream-vue` / `mermaid` / `echarts` / `stream-diffs` 会随本包安装。

```vue
<template>
  <easy-markstream :content="md" :final="done" />
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'
</script>
```

组件会自行引入 `markstream-vue` 与 KaTeX 的 CSS，不必再写 `import '@ezview/markstream/style.css'`。若宿主已有 KaTeX，请保证全局只保留一份样式。

## License

MIT。本包依赖 [markstream-vue](https://github.com/Simon-He95/markstream-vue)，Copyright (c) 2022 Simon He，MIT。
