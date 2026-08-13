<template>
  <span
    class="checkbox-node"
    role="img"
    :aria-label="node.checked ? 'checked' : 'unchecked'"
  >
    <!-- 任务完成 -->
    <svg
      v-if="node.checked"
      class="checkbox-icon checkbox-checked"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-8 -8 528 528"
      width="0.9em"
      height="0.9em"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      <path fill="#35bd4b" d="M256 0a256 256 0 1 1 0 512 256 256 0 0 1 0-512" />
      <path
        fill="#fff"
        d="M432.8 182.2 217.2 403.5a11.6 11.6 0 0 1-16.5 0L78.3 287.1a11.5 11.5 0 0 1 0-16.2l50.2-48.4a11.6 11.6 0 0 1 16.5 0l55.3 51.4 157.9-164.4a11.6 11.6 0 0 1 16.6 0l57.8 56.5c4.4 4.5 4.6 11.6.2 16.2"
      />
    </svg>
    <!-- 任务未完成 -->
    <svg
      v-else
      class="checkbox-icon checkbox-unchecked"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-8 -8 528 528"
      width="0.9em"
      height="0.9em"
      fill="none"
      overflow="visible"
      aria-hidden="true"
    >
      <path
        fill="#d2d8e0"
        fill-rule="evenodd"
        d="M256 0a256 256 0 1 1 0 512 256 256 0 0 1 0-512m0 40q-22.1 0-43.6 4.4Q191.6 48.7 172 57q-19.2 8.1-36.6 19.9-17.3 11.6-32 26.4-14.8 14.7-26.4 32-11.8 17.4-20 36.6-8.2 19.7-12.5 40.5Q40 234 40 256t4.4 43.6Q48.7 320.4 57 340q8.1 19.2 19.9 36.6 11.6 17.3 26.4 32 14.7 14.8 32 26.4 17.4 11.8 36.6 20 19.7 8.2 40.5 12.5Q234 472 256 472t43.6-4.4q20.8-4.3 40.5-12.6 19.2-8.1 36.6-19.9 17.3-11.6 32-26.4 14.8-14.7 26.4-32 11.8-17.4 20-36.6 8.2-19.7 12.5-40.5Q472 278 472 256t-4.4-43.6q-4.3-20.8-12.6-40.5-8.1-19.2-19.9-36.6-11.6-17.3-26.4-32-14.7-14.8-32-26.4-17.4-11.8-36.6-20-19.7-8.2-40.5-12.5Q278 40 256 40"
      />
    </svg>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  node: {
    type: 'checkbox'
    checked: boolean
    raw: string
  }
}>()
</script>
