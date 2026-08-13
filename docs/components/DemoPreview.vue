<template>
  <div class="demo-preview">
    <button
      type="button"
      class="demo-preview__play"
      @click="playStream"
    >
      <svg
        class="demo-preview__play-icon"
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M3.5 2.2v11.6c0 .5.5.8 1 .6l10-5.8c.4-.3.4-.9 0-1.2l-10-5.8c-.5-.2-1 .1-1 .6z"
        />
      </svg>
      播放流式效果
    </button>

    <div ref="paperRef" class="demo-preview__paper">
      <easy-markstream :content="content" :final="renderFinal" />
    </div>
  </div>
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
// @ts-ignore Vite raw import
import SAMPLE from '../.vitepress/demo-sample.md?raw'

const TICK_MS = 50
const TOKENS_PER_SEC = 140

const content = ref(SAMPLE)
const streaming = ref(false)
const isDone = ref(true)
const paperRef = ref<HTMLElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null
let tokenPos = 0
let tokenCarry = 0
let scrollFrame = 0
let resizeObserver: ResizeObserver | undefined

const renderFinal = computed(() => isDone.value || !streaming.value)

function scrollToBottomNow() {
  paperRef.value?.scrollIntoView({
    block: 'end',
    inline: 'nearest',
    behavior: 'auto',
  })
}

function scheduleScrollToBottom() {
  if (scrollFrame) { return }
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    scrollToBottomNow()
  })
}

function clearTimer() {
  if (timer != null) {
    clearTimeout(timer)
    timer = null
  }
}

function pump() {
  if (tokenPos >= SAMPLE.length) {
    streaming.value = false
    isDone.value = true
    tokenCarry = 0
    clearTimer()
    void nextTick().then(scheduleScrollToBottom)
    return
  }

  tokenCarry += TOKENS_PER_SEC * (TICK_MS / 1000)
  const chunkSize = Math.floor(tokenCarry)
  tokenCarry -= chunkSize

  if (chunkSize > 0) {
    const to = Math.min(tokenPos + chunkSize, SAMPLE.length)
    content.value += SAMPLE.slice(tokenPos, to)
    tokenPos = to
  }

  timer = setTimeout(pump, TICK_MS)
}

function playStream() {
  clearTimer()
  tokenPos = 0
  tokenCarry = 0
  content.value = ''
  isDone.value = false
  streaming.value = true
  pump()
}

watch(
  () => content.value.length,
  async () => {
    if (!streaming.value) { return }
    await nextTick()
    scheduleScrollToBottom()
  },
  { flush: 'post' },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (streaming.value) { scheduleScrollToBottom() }
  })
  if (paperRef.value) { resizeObserver.observe(paperRef.value) }
})

onBeforeUnmount(() => {
  clearTimer()
  if (scrollFrame) { cancelAnimationFrame(scrollFrame) }
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.demo-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.demo-preview__play {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 38px;
  padding: 0 20px;
  color: var(--vp-button-brand-text);
  font-weight: 600;
  font-size: 14px;
  font-family: inherit;
  line-height: 38px;
  white-space: nowrap;
  background-color: var(--vp-button-brand-bg);
  border: 1px solid var(--vp-button-brand-border);
  border-radius: 20px;
  cursor: pointer;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
}

.demo-preview__play:hover {
  color: var(--vp-button-brand-hover-text);
  background-color: var(--vp-button-brand-hover-bg);
  border-color: var(--vp-button-brand-hover-border);
}

.demo-preview__play:active {
  color: var(--vp-button-brand-active-text);
  background-color: var(--vp-button-brand-active-bg);
  border-color: var(--vp-button-brand-active-border);
  transition: color 0.1s, border-color 0.1s, background-color 0.1s;
}

.demo-preview__play-icon {
  flex-shrink: 0;
  margin-left: -2px;
}

.demo-preview__paper {
  box-sizing: border-box;
  width: 100%;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
}
</style>
