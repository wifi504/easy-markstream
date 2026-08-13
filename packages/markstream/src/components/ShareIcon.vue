<template>
  <svg
    class="share-icon"
    viewBox="0 0 1024 1024"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M838 527.5c-29 0-52.6 23.5-52.6 52.6v223.6c0 25.1-20.5 45.6-45.6 45.6H215.2c-25.1 0-45.6-20.5-45.6-45.6V279c0-25.1 20.5-45.6 45.6-45.6h219.9c29 0 52.6-23.5 52.6-52.6s-23.5-52.6-52.6-52.6H215.2c-83.1 0-150.7 67.6-150.7 150.7v524.7c0 83.1 67.6 150.7 150.7 150.7h524.6c83.1 0 150.7-67.6 150.7-150.7V580.1c0-29-23.5-52.6-52.5-52.6z"
    />
    <path
      fill="currentColor"
      d="M907 69.6H623.5c-29 0-52.6 23.5-52.6 52.6s23.5 52.6 52.6 52.6h163.4L449.2 512.3c-20.5 20.5-20.5 53.8 0 74.3 10.3 10.3 23.7 15.4 37.2 15.4 13.4 0 26.9-5.1 37.2-15.4l330.9-330.9v157.7c0 29 23.5 52.6 52.6 52.6s52.6-23.5 52.6-52.6V122.2c-0.1-29.1-23.7-52.6-52.7-52.6z"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), {
  size: '1em',
})
</script>

<style scoped>
.share-icon {
  display: inline-block;
  flex-shrink: 0;
  color: inherit;
  vertical-align: text-bottom;
}
</style>
