# @ezview/markstream

基于 [markstream-vue](https://www.npmjs.com/package/markstream-vue) 的 Vue 3 流式 Markdown 组件：GitHub 浅色观感、代码块流式高亮、Mermaid、KaTeX、链接气泡。安装一个包即可用，不必再手动装 katex / mermaid / stream-diffs。

```bash
pnpm add @ezview/markstream
```

宿主需要 **Vue 3.3+**。

```vue
<template>
  <easy-markstream :content="md" :final="done" />
</template>

<script setup>
import EasyMarkstream from '@ezview/markstream'
</script>
```

完整流式压力测试请在仓库里跑 `pnpm dev`（playground）。

## License

MIT。本包依赖 [markstream-vue](https://github.com/Simon-He95/markstream-vue)，Copyright (c) 2022 Simon He，MIT。
