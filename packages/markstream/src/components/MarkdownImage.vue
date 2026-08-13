<template>
  <span class="ms-image" :class="{ 'is-pending': showSkeleton }">
    <!-- 流式结束后尽早挂载 img 拉取资源，布局仍由骨架撑起 -->
    <img
      v-if="showImage"
      class="ms-image__img"
      :class="{
        'is-loading': !imageLoaded,
        'is-loaded': imageLoaded,
        'is-clickable': imageLoaded && !hasError && floatingUi,
      }"
      :src="requestedSrc || undefined"
      :alt="altText"
      :title="titleAttr"
      :loading="lazy ? 'lazy' : undefined"
      decoding="async"
      draggable="false"
      @error="handleImageError"
      @load="handleImageLoad"
      @click="openLightbox"
    >

    <span v-if="showSkeleton" class="ms-image__skeleton" aria-hidden="true">
      <span class="ms-image__shimmer" />
    </span>

    <span v-if="showError" class="ms-image__error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M2 2h20v10h-2V4H4v9.586l5-5L14.414 14L13 15.414l-4-4l-5 5V20h8v2H2zm13.547 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2m-3 1a3 3 0 1 1 6 0a3 3 0 0 1-6 0m3.625 6.757L19 17.586l2.828-2.829l1.415 1.415L20.414 19l2.829 2.828l-1.415 1.415L19 20.414l-2.828 2.829l-1.415-1.415L17.586 19l-2.829-2.828z"
        />
      </svg>
      <span>图片加载失败</span>
    </span>

    <image-lightbox
      v-if="floatingUi && lightboxOpen && displaySrc"
      :src="displaySrc"
      :title-text="displayName"
      @close="lightboxOpen = false"
    />
  </span>
</template>

<script setup lang="ts">
import { sanitizeImageSrc } from 'markstream-vue'
import { computed, inject, ref, watch } from 'vue'
import { FLOATING_UI_KEY } from '../utils/floating-ui-context'
import ImageLightbox from './ImageLightbox.vue'

const props = withDefaults(defineProps<{
  node: {
    type: 'image'
    src: string
    alt: string
    title: string | null
    raw: string
    loading?: boolean
  }
  fallbackSrc?: string
  lazy?: boolean
  usePlaceholder?: boolean
}>(), {
  fallbackSrc: '',
  lazy: false,
  usePlaceholder: true,
})

const floatingUi = inject(FLOATING_UI_KEY, ref(true))
const imageLoaded = ref(false)
const hasError = ref(false)
const activeSrc = ref('')
const imageStage = ref<'primary' | 'fallback' | 'failed'>('primary')
const lightboxOpen = ref(false)

const safeNodeSrc = computed(() => sanitizeImageSrc(props.node.src))
const safeFallbackSrc = computed(() => sanitizeImageSrc(props.fallbackSrc))
const displaySrc = computed(() => activeSrc.value)
const requestedSrc = computed(() => displaySrc.value)

/** 流式未完成时不挂载 img；闭合后开始请求 */
const showImage = computed(() =>
  !props.node.loading
  && imageStage.value !== 'failed'
  && activeSrc.value.length > 0,
)

const showError = computed(() => imageStage.value === 'failed')

/** 流式中 + 流式结束但未 load 完：始终骨架 */
const showSkeleton = computed(() =>
  props.usePlaceholder
  && !imageLoaded.value
  && !hasError.value
  && imageStage.value !== 'failed',
)

const altText = computed(() => String(props.node.alt || props.node.title || ''))
const titleAttr = computed(() => String(props.node.title || props.node.alt || ''))
const displayName = computed(() => {
  const name = String(props.node.alt || props.node.title || '').trim()
  return name || '图片'
})

function handleImageError() {
  if (imageStage.value === 'primary' && safeFallbackSrc.value && safeFallbackSrc.value !== activeSrc.value) {
    imageStage.value = 'fallback'
    activeSrc.value = safeFallbackSrc.value
    imageLoaded.value = false
    hasError.value = false
    return
  }
  imageStage.value = 'failed'
  hasError.value = true
}

function handleImageLoad() {
  imageLoaded.value = true
  hasError.value = false
}

function openLightbox() {
  if (!floatingUi.value || !imageLoaded.value || hasError.value || !displaySrc.value) { return }
  lightboxOpen.value = true
}

watch(
  [safeNodeSrc, safeFallbackSrc, () => props.node.loading],
  () => {
    imageLoaded.value = false
    hasError.value = false
    lightboxOpen.value = false

    if (props.node.loading) {
      activeSrc.value = safeNodeSrc.value
      imageStage.value = 'primary'
      return
    }

    if (safeNodeSrc.value) {
      activeSrc.value = safeNodeSrc.value
      imageStage.value = 'primary'
      return
    }

    if (safeFallbackSrc.value) {
      activeSrc.value = safeFallbackSrc.value
      imageStage.value = 'fallback'
      return
    }

    activeSrc.value = ''
    imageStage.value = 'failed'
    hasError.value = true
  },
  { immediate: true },
)
</script>

<style scoped>
.ms-image {
  position: relative;
  display: block;
  max-width: 100%;
  margin: 0 0 16px;
  text-align: left;
  vertical-align: top;
}

.ms-image.is-pending {
  min-height: 8rem;
}

.ms-image__img {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 600px;
  margin: 0;
  vertical-align: top;
  background: #fff;
  border-style: none;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.ms-image__img.is-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  max-width: none;
  height: 1px;
  max-height: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.ms-image__img.is-loaded {
  position: static;
  width: auto;
  height: auto;
  opacity: 1;
  pointer-events: auto;
}

.ms-image__img.is-clickable {
  cursor: zoom-in;
}

.ms-image__skeleton {
  display: block;
  width: 100%;
  min-height: 8rem;
  overflow: hidden;
  background: #f6f8fa;
}

.ms-image__shimmer {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 8rem;
  background: linear-gradient(
    90deg,
    #f6f8fa 0%,
    rgb(89 99 110 / 6%) 50%,
    #f6f8fa 100%
  );
  background-size: 200% 100%;
  animation: ms-image-shimmer 1.5s ease-in-out infinite;
}

.ms-image__error {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-height: 4rem;
  padding: 1rem 1.5rem;
  color: #59636e;
  font-size: 14px;
  vertical-align: middle;
  background: #f6f8fa;
}

@media (prefers-reduced-motion: reduce) {
  .ms-image__shimmer {
    animation: none !important;
  }
}

@keyframes ms-image-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
