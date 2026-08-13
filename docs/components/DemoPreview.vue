<template>
  <div class="demo-preview">
    <easy-markstream :content="sample" :final="true" />
  </div>
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'

const sample = `# EasyMarkstream

基于 **markstream-vue** 的开箱即用封装。

- 行内公式 $E = mc^2$
- 代码：

\`\`\`ts
export const hello = 'world'
\`\`\`

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[EasyMarkstream]
  B --> C[页面]
\`\`\`
`
</script>

<style scoped>
.demo-preview {
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
}
</style>
