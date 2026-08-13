<template>
  <div ref="rootEl" class="ms-mermaid">
    <header class="ms-mermaid__header">
      <div class="ms-mermaid__toggle" role="group" aria-label="显示模式">
        <hover-popover content="预览">
          <button
            type="button"
            class="ms-mermaid__toggle-btn"
            :class="{ 'is-active': mode === 'preview' }"
            :disabled="loading"
            aria-label="预览"
            @click="setMode('preview')"
          >
            <!-- 预览：eye -->
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M8 2c3.314 0 6.142 2.163 7.5 5.25C14.142 10.337 11.314 12.5 8 12.5S1.858 10.337.5 7.25C1.858 4.163 4.686 2 8 2Zm0 1.5C5.514 3.5 3.32 5.13 2.2 7.25 3.32 9.37 5.514 11 8 11s4.68-1.63 5.8-3.75C12.68 5.13 10.486 3.5 8 3.5Zm0 1.25a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
            </svg>
          </button>
        </hover-popover>
        <hover-popover content="源码">
          <button
            type="button"
            class="ms-mermaid__toggle-btn"
            :class="{ 'is-active': mode === 'source' }"
            aria-label="源码"
            @click="setMode('source')"
          >
            <code-bracket-icon :size="15" />
          </button>
        </hover-popover>
      </div>

      <div class="ms-mermaid__actions">
        <hover-popover :content="copied ? '已复制' : '复制源码'">
          <button
            type="button"
            class="ms-mermaid__icon-btn"
            :aria-label="copied ? '已复制' : '复制源码'"
            @click="copySource"
          >
            <!-- 已复制：勾 -->
            <svg v-if="copied" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L6.5 11.5 2.5 7.5" />
            </svg>
            <!-- 复制 -->
            <svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
              <path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
            </svg>
          </button>
        </hover-popover>
        <hover-popover content="保存SVG">
          <button
            type="button"
            class="ms-mermaid__icon-btn"
            aria-label="保存SVG"
            :disabled="!svgMarkup"
            @click="downloadSvg"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z" />
              <path fill="currentColor" d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z" />
            </svg>
          </button>
        </hover-popover>
        <div v-if="mode === 'preview'" class="ms-mermaid__zoom">
          <hover-popover content="缩小">
            <button
              type="button"
              class="ms-mermaid__icon-btn"
              aria-label="缩小"
              @click="zoomOut"
            >
              −
            </button>
          </hover-popover>
          <hover-popover content="重置为100%">
            <button
              type="button"
              class="ms-mermaid__zoom-label"
              aria-label="重置为100%"
              @click="resetZoom"
            >
              {{ zoomPercent }}%
            </button>
          </hover-popover>
          <hover-popover content="放大">
            <button
              type="button"
              class="ms-mermaid__icon-btn"
              aria-label="放大"
              @click="zoomIn"
            >
              +
            </button>
          </hover-popover>
        </div>
      </div>
    </header>

    <!-- v-if：避免在 preview 隐藏时增强 stream-diffs（宽度为 0 → 无高亮感 / 横滑失效） -->
    <div v-if="mode === 'source'" class="ms-mermaid__source">
      <code-block-node
        :node="(codeNode as any)"
        :loading="loading"
        :stream="loading"
        :is-dark="isDark"
        :themes="resolvedThemes"
        :theme="resolvedTheme"
        :monaco-options="resolvedMonacoOptions"
        :show-header="false"
        :show-tooltips="false"
        :custom-id="customId"
      />
    </div>

    <div
      v-show="mode === 'preview'"
      ref="previewEl"
      class="ms-mermaid__preview"
      :class="{ 'is-dragging': dragging }"
      :style="previewBoxStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @lostpointercapture="onPointerUp"
    >
      <div v-if="rendering" class="ms-mermaid__loading" role="status" aria-live="polite">
        <span class="ms-mermaid__spinner" />
      </div>
      <p v-else-if="renderError" class="ms-mermaid__error">
        {{ renderError }}
      </p>
      <div
        v-else
        ref="canvasEl"
        class="ms-mermaid__canvas"
        :style="canvasTransformStyle"
        v-html="svgMarkup"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeBlockMonacoOptions, CodeBlockThemeProp } from 'markstream-vue'
import { CodeBlockNode } from 'markstream-vue'
import mermaid from 'mermaid'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { scanAndBindCodeHScroll } from '../utils/code-hscroll-util'
import CodeBracketIcon from './CodeBracketIcon.vue'
import HoverPopover from './HoverPopover.vue'

type Mode = 'preview' | 'source'

const props = withDefaults(defineProps<{
  node: Record<string, any>
  loading?: boolean
  isDark?: boolean
  indexKey?: string | number
  customId?: string
  estimatedPreviewHeightPx?: number
  themes?: [string, string] | string[]
  theme?: CodeBlockThemeProp
  monacoOptions?: CodeBlockMonacoOptions
}>(), {
  loading: false,
  isDark: false,
  estimatedPreviewHeightPx: 200,
})

const DEFAULT_THEMES: [string, string] = ['github-dark', 'github-light']
const DEFAULT_THEME: CodeBlockThemeProp = { dark: 'github-dark', light: 'github-light' }
const DEFAULT_MONACO: CodeBlockMonacoOptions = {
  fontSize: 13,
  lineHeight: 18,
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  tabSize: 2,
  wordWrap: 'off',
  MAX_HEIGHT: 100_000,
  padding: { top: 8, bottom: 8 },
}

let mermaidReady = false
function ensureMermaid() {
  if (mermaidReady) { return }
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: props.isDark ? 'dark' : 'default',
  })
  mermaidReady = true
}

const mode = ref<Mode>(props.loading ? 'source' : 'preview')
const rendering = ref(false)
const renderError = ref('')
const svgMarkup = ref('')

/** 用户缩放；1 = 100% = SVG 宽度等于预览盒宽度 */
const zoom = ref(1)
/** 相对 SVG 原始尺寸：铺满预览盒宽度所需缩放 */
const fitScale = ref(1)
const naturalSize = ref({ w: 0, h: 0 })
/** 100% 时锁定的预览盒尺寸 */
const lockedSize = ref({ w: 0, h: 0 })
const pan = ref({ x: 0, y: 0 })
const dragging = ref(false)

const rootEl = ref<HTMLElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLElement | null>(null)
const copied = ref(false)

let renderSeq = 0
let resizeObserver: ResizeObserver | null = null
let dragPointerId: number | null = null
let dragStart = { x: 0, y: 0, panX: 0, panY: 0 }
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const zoomPercent = computed(() => Math.round(zoom.value * 100))

const sourceCode = computed(() => {
  const n = props.node
  return String(n?.code ?? n?.raw ?? n?.value ?? '')
})

const codeNode = computed(() => ({
  type: 'code_block',
  language: 'mermaid',
  code: sourceCode.value,
  raw: sourceCode.value,
  loading: !!props.loading,
}))

/** 预览盒锁定为 100% 适配后的尺寸；放大时在盒内拖动 */
const previewBoxStyle = computed(() => {
  if (rendering.value || renderError.value) { return { minHeight: `${props.estimatedPreviewHeightPx || 200}px` } }
  if (!lockedSize.value.w || !lockedSize.value.h) { return { minHeight: `${props.estimatedPreviewHeightPx || 200}px` } }
  return {
    width: '100%',
    height: `${lockedSize.value.h}px`,
  }
})

/** 缩放改真实宽高（勿用 CSS scale，小屏放大易糊） */
const canvasTransformStyle = computed(() => {
  const { w, h } = naturalSize.value
  if (!w || !h) { return undefined }
  const dispW = w * fitScale.value * zoom.value
  const dispH = h * fitScale.value * zoom.value
  return {
    width: `${dispW}px`,
    height: `${dispH}px`,
    transform: `translate(${pan.value.x}px, ${pan.value.y}px)`,
    transformOrigin: 'center center',
  }
})

const resolvedThemes = computed(() => props.themes ?? DEFAULT_THEMES)
const resolvedTheme = computed(() => props.theme ?? DEFAULT_THEME)
const resolvedMonacoOptions = computed(() => props.monacoOptions ?? DEFAULT_MONACO)

const renderId = computed(() => {
  const key = props.indexKey ?? 'mermaid'
  return `ms-mermaid-${String(key).replace(/[^\w-]/g, '-')}`
})

function setMode(next: Mode) {
  if (next === 'preview' && props.loading) { return }
  mode.value = next
  if (next === 'source') {
    void nextTick(() => {
      // 等 CodeBlockNode / diffs 挂上后再绑横滑
      window.setTimeout(() => {
        scanAndBindCodeHScroll(rootEl.value ?? document)
      }, 80)
    })
  }
}

function markCopied() {
  copied.value = true
  if (copiedTimer) { clearTimeout(copiedTimer) }
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = null
  }, 1000)
}

async function copySource() {
  const text = sourceCode.value
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text) } else { throw new Error('clipboard unavailable') }
    markCopied()
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      markCopied()
    } catch {
      // ignore
    }
  }
}

function downloadSvg() {
  if (!svgMarkup.value) { return }
  const blob = new Blob([svgMarkup.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'diagram.svg'
  a.click()
  URL.revokeObjectURL(url)
}

function zoomIn() {
  zoom.value = Math.min(3, Math.round((zoom.value + 0.1) * 10) / 10)
}

function zoomOut() {
  zoom.value = Math.max(0.2, Math.round((zoom.value - 0.1) * 10) / 10)
}

function resetZoom() {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
}

/** 优先 viewBox，避免 getBBox 在甘特/状态图上读到错误超大尺寸 */
function readNaturalSize(svg: SVGSVGElement) {
  const viewBox = svg.viewBox?.baseVal
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) { return { w: viewBox.width, h: viewBox.height } }

  const attrW = Number.parseFloat(svg.getAttribute('width') || '')
  const attrH = Number.parseFloat(svg.getAttribute('height') || '')
  if (attrW > 0 && attrH > 0) { return { w: attrW, h: attrH } }

  try {
    const box = svg.getBBox()
    if (box.width > 0 && box.height > 0) { return { w: box.width, h: box.height } }
  } catch {
    // ignore
  }

  const rect = svg.getBoundingClientRect()
  return {
    w: rect.width || 400,
    h: rect.height || 240,
  }
}

function applySvgDisplaySize() {
  const svg = canvasEl.value?.querySelector('svg')
  if (!(svg instanceof SVGSVGElement) || !naturalSize.value.w) { return }
  const w = naturalSize.value.w * fitScale.value * zoom.value
  const h = naturalSize.value.h * fitScale.value * zoom.value
  svg.style.width = `${w}px`
  svg.style.height = `${h}px`
  svg.style.maxWidth = 'none'
  svg.style.display = 'block'
  svg.removeAttribute('width')
  svg.removeAttribute('height')
}

const PREVIEW_MIN_H = 200
const PREVIEW_MAX_H = 600

/**
 * 100%：优先铺满预览盒宽度；若高度会超过 MAX，则改为 contain（缩进盒内）。
 * 居中由预览盒 flex 负责（矮图竖直、窄图水平）；pan 仅用于拖拽。
 */
function updateFitToWidth() {
  const box = previewEl.value || rootEl.value
  const { w, h } = naturalSize.value
  if (!box || !w || !h) { return }

  const availW = Math.max(1, (previewEl.value || box).clientWidth || box.clientWidth)
  const scaleByWidth = availW / w
  const heightIfFullWidth = h * scaleByWidth

  let scale = scaleByWidth
  let boxH = heightIfFullWidth
  if (heightIfFullWidth > PREVIEW_MAX_H) {
    scale = PREVIEW_MAX_H / h
    boxH = PREVIEW_MAX_H
  } else {
    boxH = Math.max(PREVIEW_MIN_H, heightIfFullWidth)
  }

  fitScale.value = scale
  lockedSize.value = {
    w: availW,
    h: boxH,
  }

  void nextTick(() => applySvgDisplaySize())
}

async function syncSvgMetrics() {
  await nextTick()
  await nextTick()
  const svg = canvasEl.value?.querySelector('svg')
  if (!(svg instanceof SVGSVGElement)) {
    naturalSize.value = { w: 0, h: 0 }
    lockedSize.value = { w: 0, h: 0 }
    return
  }
  naturalSize.value = readNaturalSize(svg)
  updateFitToWidth()
}

async function renderPreview() {
  const code = sourceCode.value.trim()
  if (!code) {
    svgMarkup.value = ''
    renderError.value = ''
    rendering.value = false
    naturalSize.value = { w: 0, h: 0 }
    lockedSize.value = { w: 0, h: 0 }
    return
  }

  const seq = ++renderSeq
  rendering.value = true
  renderError.value = ''
  try {
    ensureMermaid()
    const { svg } = await mermaid.render(`${renderId.value}-${seq}`, code)
    if (seq !== renderSeq) { return }
    svgMarkup.value = svg
    zoom.value = 1
    pan.value = { x: 0, y: 0 }
    // 先结束 loading，再量尺寸（loading 时预览区可能未展示）
    rendering.value = false
    await syncSvgMetrics()
  } catch (err) {
    if (seq !== renderSeq) { return }
    svgMarkup.value = ''
    naturalSize.value = { w: 0, h: 0 }
    lockedSize.value = { w: 0, h: 0 }
    renderError.value = err instanceof Error ? err.message : String(err)
  } finally {
    if (seq === renderSeq) { rendering.value = false }
  }
}

function onPointerDown(e: PointerEvent) {
  if (mode.value !== 'preview' || rendering.value || renderError.value || !svgMarkup.value) { return }
  if (e.button !== 0) { return }
  const target = e.target as HTMLElement | null
  if (target?.closest('button, a, input')) { return }

  dragging.value = true
  dragPointerId = e.pointerId
  dragStart = { x: e.clientX, y: e.clientY, panX: pan.value.x, panY: pan.value.y }
  previewEl.value?.setPointerCapture(e.pointerId)
  e.preventDefault()
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value || dragPointerId !== e.pointerId) { return }
  pan.value = {
    x: dragStart.panX + (e.clientX - dragStart.x),
    y: dragStart.panY + (e.clientY - dragStart.y),
  }
}

function onPointerUp(e: PointerEvent) {
  if (dragPointerId !== null && e.pointerId !== dragPointerId) { return }
  dragging.value = false
  dragPointerId = null
  try {
    previewEl.value?.releasePointerCapture(e.pointerId)
  } catch {
    // ignore
  }
}

watch(
  () => props.loading,
  (loading) => {
    if (loading) {
      mode.value = 'source'
      return
    }
    mode.value = 'preview'
    void renderPreview()
  },
  { immediate: true },
)

watch(
  () => [mode.value, sourceCode.value, props.isDark] as const,
  ([m]) => {
    if (m === 'preview' && !props.loading) { void renderPreview() }
  },
)

watch([fitScale, zoom, () => naturalSize.value.w], () => {
  void nextTick(() => applySvgDisplaySize())
})

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') { return }
  resizeObserver = new ResizeObserver(() => {
    if (mode.value === 'preview' && naturalSize.value.w) {
      const keepZoom = zoom.value
      const keepPan = { ...pan.value }
      updateFitToWidth()
      zoom.value = keepZoom
      pan.value = keepPan
    }
  })
  const observeTarget = rootEl.value
  if (observeTarget) { resizeObserver.observe(observeTarget) }
})

onBeforeUnmount(() => {
  renderSeq += 1
  resizeObserver?.disconnect()
  resizeObserver = null
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped>
.ms-mermaid {
  margin: var(--ms-flow-diagram-y, 16px) 0;

  /* 不用 overflow:hidden，避免裁切 Header 上的 HoverPopover */
  overflow: visible;
  background: #fff;
  border: 1px solid var(--diagram-border, #d0d7de);
  border-radius: 4px;
}

.ms-mermaid__header {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  overflow: visible;
  border-bottom: 1px solid var(--diagram-border, #d0d7de);
}

.ms-mermaid__toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px;
  background: #f6f8fa;
  border-radius: 6px;
}

.ms-mermaid__toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* 保持原先「预览 / 源码」两字宽度 */
  min-width: 2em;
  height: 22px;
  padding: 2px 10px;
  color: #59636e;
  font-size: 12px;
  line-height: 18px;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.ms-mermaid__toggle-btn.is-active {
  color: #1f2328;
  background: #fff;
  box-shadow: 0 0 0 1px rgb(31 35 40 / 8%);
}

.ms-mermaid__toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.ms-mermaid__actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ms-mermaid__zoom {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  margin-left: 4px;
}

.ms-mermaid__zoom-label {
  min-width: 44px;
  padding: 2px 4px;
  color: #59636e;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.ms-mermaid__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #59636e;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.ms-mermaid__icon-btn:hover:not(:disabled) {
  background: #f0f2f4;
}

.ms-mermaid__icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.ms-mermaid__source {
  overflow: hidden;
  border-radius: 0 0 4px 4px;
}

.ms-mermaid__source :deep(.code-block-container) {
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
}

.ms-mermaid__preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #fff;
  border-radius: 0 0 4px 4px;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.ms-mermaid__preview.is-dragging {
  cursor: grabbing;
}

.ms-mermaid__canvas {
  flex: 0 0 auto;
}

.ms-mermaid__loading,
.ms-mermaid__error {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  width: 100%;
  min-height: 120px;
  color: #59636e;
  font-size: 13px;
}

.ms-mermaid__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgb(89 99 110 / 15%);
  border-top-color: rgb(89 99 110 / 80%);
  border-radius: 50%;
  animation: ms-mermaid-spin 0.8s linear infinite;
}

@keyframes ms-mermaid-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
