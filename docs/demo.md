<script setup lang="ts">
import DemoPreview from './components/DemoPreview.vue'
</script>

# 现场演示

下面在浏览器里渲染（构建期包在 `ClientOnly` 中，避免 Node 访问 DOM）。

<ClientOnly>
  <DemoPreview />
</ClientOnly>
