<template>
  <div class="stream-demo">
    <header class="stream-demo__bar">
      <strong>@ezview/markstream 渲染能力测试</strong>
      <span v-if="error" class="stream-demo__meta">失败：{{ error }}</span>

      <label class="stream-demo__field">
        <span>速度：</span>
        <input
          v-model.number="tokensPerSec"
          type="number"
          min="1"
          max="10000"
          step="1"
        >
        <span>tokens/s</span>
      </label>

      <label class="stream-demo__field">
        <span>循环：</span>
        <input
          :value="docLoops"
          type="number"
          min="1"
          max="50"
          step="1"
          :disabled="streaming"
          @change="onDocLoopsInput"
        >
        <span>次</span>
      </label>

      <label class="stream-demo__field">
        <span>坐标：</span>
        <input
          :value="tokenPos"
          type="number"
          min="0"
          :max="source.length || undefined"
          step="1"
          :disabled="streaming"
          @change="onTokenPosInput"
        >
        <span>/ {{ source.length }} token</span>
      </label>

      <label class="stream-demo__switch">
        <input v-model="stickToBottom" type="checkbox">
        <span class="stream-demo__switch-track" aria-hidden="true" />
        <span>滚动到底部</span>
      </label>

      <div class="stream-demo__actions">
        <button type="button" :disabled="!canStart" @click="startStream">
          开始流式
        </button>
        <button type="button" class="is-pause" :disabled="!streaming" @click="pauseStream">
          暂停
        </button>
        <button type="button" class="is-reset" @click="resetStream">
          重置
        </button>
      </div>
    </header>

    <main
      ref="scrollRoot"
      class="stream-demo__body"
    >
      <div ref="contentRoot" class="stream-demo__paper">
        <easy-markstream :content="content" :final="renderFinal" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import EasyMarkstream from '@ezview/markstream'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/** public/test-cases 下的压力测试文档（模拟 SSE 源） */
const DOC_URL = '/test-cases/markdown-renderer-stress-test.md'

/** 模拟 chunk 到达的 tick（ms）；可见节奏交给 markstream smooth-streaming */
const TICK_MS = 50

const source = ref('')
const rawDoc = ref('')
const content = ref('')
const isDone = ref(false)
const streaming = ref(false)
const error = ref('')
const scrollRoot = ref<HTMLElement | null>(null)
const contentRoot = ref<HTMLElement | null>(null)
/** 开：内容变化时永远滚到底；关：完全不自动滚 */
const stickToBottom = ref(true)
/** 模拟吞吐：1 token ≈ 1 字符 */
const tokensPerSec = ref(80)
/** 原文重复次数；1 = 约一万字 */
const docLoops = ref(1)
/** 当前已灌入到 source 的下标 */
const tokenPos = ref(0)

let timer: ReturnType<typeof setTimeout> | null = null
let scrollFrame = 0
let tokenCarry = 0
let resizeObserver: ResizeObserver | undefined

const canStart = computed(() => {
  return !streaming.value
    && !error.value
    && source.value.length > 0
    && tokenPos.value < source.value.length
})

/**
 * 跳转坐标 / 暂停是快照预览，必须 final=true。
 * 否则内容停在未闭合 fence 时，markstream 会重复表格等节点。
 */
const renderFinal = computed(() => isDone.value || !streaming.value)

function scrollToBottomNow() {
  const root = scrollRoot.value
  if (!root) { return }
  root.scrollTo({
    top: root.scrollHeight,
    behavior: 'auto',
  })
}

function scheduleScrollToBottom() {
  if (!stickToBottom.value || scrollFrame) { return }
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    if (!stickToBottom.value) { return }
    scrollToBottomNow()
  })
}

function clearTimer() {
  if (timer != null) {
    clearTimeout(timer)
    timer = null
  }
}

function resolveTokensPerSec() {
  const n = Number(tokensPerSec.value)
  if (!Number.isFinite(n) || n < 1) { return 1 }
  return Math.min(10000, Math.floor(n))
}

function resolveDocLoops() {
  const n = Number(docLoops.value)
  if (!Number.isFinite(n) || n < 1) { return 1 }
  return Math.min(50, Math.floor(n))
}

function applyLoops() {
  const n = resolveDocLoops()
  docLoops.value = n
  if (!rawDoc.value) {
    source.value = ''
    return
  }
  source.value = n === 1
    ? rawDoc.value
    : Array.from({ length: n }, () => rawDoc.value).join('\n\n')
}

function onDocLoopsInput(event: Event) {
  const el = event.target as HTMLInputElement
  docLoops.value = Number(el.value)
  applyLoops()
  seekTo(Math.min(tokenPos.value, source.value.length))
}

function seekTo(pos: number) {
  const max = source.value.length
  const next = Math.max(0, Math.min(max, Math.floor(pos) || 0))
  tokenPos.value = next
  content.value = source.value.slice(0, next)
  isDone.value = max > 0 && next >= max
  tokenCarry = 0
}

function onTokenPosInput(event: Event) {
  const el = event.target as HTMLInputElement
  seekTo(Number(el.value))
}

function pump() {
  if (tokenPos.value >= source.value.length) {
    streaming.value = false
    isDone.value = true
    tokenCarry = 0
    clearTimer()
    return
  }

  const rate = resolveTokensPerSec()
  tokenCarry += rate * (TICK_MS / 1000)
  const chunkSize = Math.floor(tokenCarry)
  tokenCarry -= chunkSize

  if (chunkSize > 0) {
    const from = tokenPos.value
    const to = Math.min(from + chunkSize, source.value.length)
    content.value += source.value.slice(from, to)
    tokenPos.value = to
  }

  timer = setTimeout(pump, TICK_MS)
}

async function loadSource() {
  if (!rawDoc.value) {
    const res = await fetch(DOC_URL)
    if (!res.ok) { throw new Error(`HTTP ${res.status}`) }
    rawDoc.value = await res.text()
  }
  applyLoops()
}

async function startStream() {
  if (streaming.value) { return }

  clearTimer()
  error.value = ''
  isDone.value = false
  tokenCarry = 0
  tokensPerSec.value = resolveTokensPerSec()

  try {
    await loadSource()
    seekTo(tokenPos.value)
    if (tokenPos.value >= source.value.length) {
      isDone.value = true
      return
    }
    streaming.value = true
    pump()
  } catch (e) {
    streaming.value = false
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function pauseStream() {
  if (!streaming.value) { return }
  clearTimer()
  streaming.value = false
  tokenCarry = 0
}

function resetStream() {
  clearTimer()
  streaming.value = false
  error.value = ''
  seekTo(0)
}

watch(
  () => `${content.value.length}:${isDone.value}`,
  async () => {
    await nextTick()
    scheduleScrollToBottom()
  },
  { flush: 'post' },
)

watch(stickToBottom, (on) => {
  if (on) { scheduleScrollToBottom() }
})

onMounted(() => {
  resizeObserver = new ResizeObserver(scheduleScrollToBottom)
  if (contentRoot.value) { resizeObserver.observe(contentRoot.value) }

  void loadSource().catch((e) => {
    error.value = e instanceof Error ? e.message : String(e)
  })
})

onBeforeUnmount(() => {
  clearTimer()
  if (scrollFrame) { cancelAnimationFrame(scrollFrame) }
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.stream-demo {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #1a1a1a;
  background: #f6f7f9;
}

.stream-demo__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.stream-demo__meta {
  color: #6b7280;
  font-size: 13px;
}

.stream-demo__field {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.stream-demo__field input[type='number'] {
  box-sizing: border-box;
  width: 88px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.stream-demo__switch {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.stream-demo__switch input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
}

.stream-demo__switch-track {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 20px;
  background: #d1d5db;
  border-radius: 999px;
  transition: background-color 0.15s ease;
}

.stream-demo__switch-track::after {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 16%);
  transition: transform 0.15s ease;
  content: '';
}

.stream-demo__switch input:checked + .stream-demo__switch-track {
  background: #2563eb;
}

.stream-demo__switch input:checked + .stream-demo__switch-track::after {
  transform: translateX(16px);
}

.stream-demo__switch input:focus-visible + .stream-demo__switch-track {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.stream-demo__actions {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}

.stream-demo__actions button {
  height: 32px;
  padding: 0 12px;
  color: #fff;
  font-size: 13px;
  background: #2563eb;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.stream-demo__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.stream-demo__actions button.is-pause {
  background: #d97706;
}

.stream-demo__actions button.is-reset {
  color: #111827;
  background: #e5e7eb;
}

.stream-demo__body {
  flex: 1;
  padding: 24px 16px 40px;
  overflow: auto;
}

.stream-demo__paper {
  box-sizing: border-box;
  max-width: 1012px;
  margin: 0 auto;
  padding: 32px 40px 48px;
  background: #fff;
  border: 1px solid #d1d9e0;
  border-radius: 6px;
}
</style>
