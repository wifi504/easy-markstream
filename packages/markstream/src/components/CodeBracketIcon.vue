<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" aria-hidden="true">
    <path
      d="M7.5 7L3 12l4.5 5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13.25 5.5l-2.5 13"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
    <path
      d="M16.5 7L21 12l-4.5 5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number | string }>(), {
  size: 15,
})
</script>
