<template>
  <div ref="rootEl" class="ms-echarts">
    <header class="ms-echarts__header">
      <div class="ms-echarts__toggle" role="group" aria-label="显示模式">
        <hover-popover content="预览">
          <button
            type="button"
            class="ms-echarts__toggle-btn"
            :class="{ 'is-active': mode === 'preview' }"
            :disabled="loading"
            aria-label="预览"
            @click="setMode('preview')"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M8 2c3.314 0 6.142 2.163 7.5 5.25C14.142 10.337 11.314 12.5 8 12.5S1.858 10.337.5 7.25C1.858 4.163 4.686 2 8 2Zm0 1.5C5.514 3.5 3.32 5.13 2.2 7.25 3.32 9.37 5.514 11 8 11s4.68-1.63 5.8-3.75C12.68 5.13 10.486 3.5 8 3.5Zm0 1.25a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
            </svg>
          </button>
        </hover-popover>
        <hover-popover content="源码">
          <button
            type="button"
            class="ms-echarts__toggle-btn"
            :class="{ 'is-active': mode === 'source' }"
            aria-label="源码"
            @click="setMode('source')"
          >
            <code-bracket-icon :size="15" />
          </button>
        </hover-popover>
      </div>

      <div class="ms-echarts__actions">
        <hover-popover :content="copied ? '已复制' : copyActionLabel">
          <button
            type="button"
            class="ms-echarts__icon-btn"
            :aria-label="copied ? '已复制' : copyActionLabel"
            :disabled="copyDisabled"
            @click="copyCurrent"
          >
            <svg v-if="copied" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L6.5 11.5 2.5 7.5" />
            </svg>
            <svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
              <path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0-.25-.25Z" />
            </svg>
          </button>
        </hover-popover>
        <hover-popover content="保存SVG">
          <button
            type="button"
            class="ms-echarts__icon-btn"
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
        <div v-if="mode === 'preview'" class="ms-echarts__zoom">
          <hover-popover content="缩小">
            <button
              type="button"
              class="ms-echarts__icon-btn"
              aria-label="缩小"
              @click="zoomOut"
            >
              −
            </button>
          </hover-popover>
          <hover-popover content="重置为100%">
            <button
              type="button"
              class="ms-echarts__zoom-label"
              aria-label="重置为100%"
              @click="resetZoom"
            >
              {{ zoomPercent }}%
            </button>
          </hover-popover>
          <hover-popover content="放大">
            <button
              type="button"
              class="ms-echarts__icon-btn"
              aria-label="放大"
              @click="zoomIn"
            >
              +
            </button>
          </hover-popover>
        </div>
      </div>
    </header>

    <div v-if="mode === 'source'" class="ms-echarts__source">
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
      class="ms-echarts__preview"
      :class="{ 'is-dragging': dragging }"
      :style="previewBoxStyle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @lostpointercapture="onPointerUp"
    >
      <div v-if="rendering" class="ms-echarts__loading" role="status" aria-live="polite">
        <span class="ms-echarts__spinner" />
      </div>
      <p v-else-if="renderError" class="ms-echarts__error">
        {{ renderError }}
      </p>
      <div
        v-show="!renderError"
        class="ms-echarts__canvas"
        :style="canvasTransformStyle"
      >
        <div ref="chartHostEl" class="ms-echarts__chart" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeBlockMonacoOptions, CodeBlockThemeProp } from 'markstream-vue'
import * as echarts from 'echarts'
import { CodeBlockNode } from 'markstream-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { copySvgElementAsPng, copyText } from '../utils/clipboard-util'
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
  estimatedPreviewHeightPx: 400,
})

const PREVIEW_H = 400

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

const mode = ref<Mode>(props.loading ? 'source' : 'preview')
const rendering = ref(false)
const renderError = ref('')
const svgMarkup = ref('')

const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const dragging = ref(false)
const lockedSize = ref({ w: 0, h: PREVIEW_H })

const rootEl = ref<HTMLElement | null>(null)
const previewEl = ref<HTMLElement | null>(null)
const chartHostEl = ref<HTMLElement | null>(null)
const copied = ref(false)
const chartReady = ref(false)

let chartInstance: echarts.ECharts | null = null
let renderSeq = 0
let resizeObserver: ResizeObserver | null = null
let dragPointerId: number | null = null
let dragStart = { x: 0, y: 0, panX: 0, panY: 0 }
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const zoomPercent = computed(() => Math.round(zoom.value * 100))

const copyActionLabel = computed(() => (mode.value === 'preview' ? '复制图片' : '复制源码'))
const copyDisabled = computed(() => (
  mode.value === 'preview' && (!chartReady.value || rendering.value || !!renderError.value)
))

const sourceCode = computed(() => {
  const n = props.node
  return String(n?.code ?? n?.raw ?? n?.value ?? n?.content ?? '')
})

const codeNode = computed(() => ({
  type: 'code_block',
  language: 'json',
  code: sourceCode.value,
  raw: sourceCode.value,
  loading: !!props.loading,
}))

const previewBoxStyle = computed(() => ({
  width: '100%',
  height: `${PREVIEW_H}px`,
}))

const canvasTransformStyle = computed(() => {
  const w = lockedSize.value.w
  const h = lockedSize.value.h || PREVIEW_H
  return {
    width: w ? `${w}px` : '100%',
    height: `${h}px`,
    transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
    transformOrigin: 'center center',
  }
})

const resolvedThemes = computed(() => props.themes ?? DEFAULT_THEMES)
const resolvedTheme = computed(() => props.theme ?? DEFAULT_THEME)
const resolvedMonacoOptions = computed(() => props.monacoOptions ?? DEFAULT_MONACO)

function setMode(next: Mode) {
  if (next === 'preview' && props.loading) { return }
  mode.value = next
  if (next === 'source') {
    void nextTick(() => {
      window.setTimeout(() => {
        scanAndBindCodeHScroll(rootEl.value ?? document)
      }, 80)
    })
    return
  }
  void nextTick(() => {
    if (chartInstance && !renderError.value) {
      layoutChartHost()
      chartInstance.resize()
      void nextTick(() => captureSvgMarkup())
    } else if (!props.loading) {
      void renderPreview()
    }
  })
}

function markCopied() {
  copied.value = true
  if (copiedTimer) { clearTimeout(copiedTimer) }
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = null
  }, 1000)
}

async function copyCurrent() {
  if (mode.value === 'preview') {
    const svg = findChartSvg()
    if (!svg || !chartInstance) { return }
    if (await copySvgElementAsPng(svg, {
      cssWidth: Math.max(1, chartInstance.getWidth()),
      cssHeight: Math.max(1, chartInstance.getHeight()),
    })) { markCopied() }
    return
  }
  if (await copyText(sourceCode.value)) { markCopied() }
}

function findChartSvg(): SVGSVGElement | null {
  const svg = chartHostEl.value?.querySelector('svg')
  return svg instanceof SVGSVGElement ? svg : null
}

function captureSvgMarkup() {
  const svg = findChartSvg()
  if (!svg) {
    svgMarkup.value = ''
    return
  }
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('style')
  if (chartInstance) {
    clone.setAttribute('width', String(Math.round(chartInstance.getWidth())))
    clone.setAttribute('height', String(Math.round(chartInstance.getHeight())))
  }
  svgMarkup.value = new XMLSerializer().serializeToString(clone)
}

function downloadSvg() {
  if (!svgMarkup.value) { return }
  const blob = new Blob([svgMarkup.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'chart.svg'
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

function disposeChart() {
  chartInstance?.dispose()
  chartInstance = null
  chartReady.value = false
  svgMarkup.value = ''
}

function layoutChartHost() {
  const box = previewEl.value || rootEl.value
  const host = chartHostEl.value
  if (!box || !host) { return { w: 0, h: PREVIEW_H } }
  const w = Math.max(1, (previewEl.value || box).clientWidth || box.clientWidth)
  host.style.width = `${w}px`
  host.style.height = `${PREVIEW_H}px`
  lockedSize.value = { w, h: PREVIEW_H }
  return { w, h: PREVIEW_H }
}

function waitChartFinished(chart: echarts.ECharts, timeoutMs = 400): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) { return }
      settled = true
      chart.off('finished', done)
      resolve()
    }
    chart.on('finished', done)
    window.setTimeout(done, timeoutMs)
  })
}

function parseOption(code: string): Record<string, unknown> {
  const option = JSON.parse(code) as unknown
  if (!option || typeof option !== 'object' || Array.isArray(option)) {
    throw new Error('图表配置必须是 JSON 对象')
  }
  return option as Record<string, unknown>
}

async function renderPreview() {
  if (props.loading || mode.value !== 'preview') { return }

  const code = sourceCode.value.trim()
  if (!code) {
    disposeChart()
    renderError.value = '图表配置为空'
    rendering.value = false
    return
  }

  let option: Record<string, unknown>
  try {
    option = parseOption(code)
  } catch (err) {
    disposeChart()
    renderError.value = err instanceof Error ? err.message : String(err)
    rendering.value = false
    return
  }

  const seq = ++renderSeq
  rendering.value = true
  renderError.value = ''
  try {
    await nextTick()
    if (seq !== renderSeq) { return }
    if (typeof window === 'undefined') {
      rendering.value = false
      return
    }

    const { w } = layoutChartHost()
    const host = chartHostEl.value
    if (!host || w <= 0) {
      rendering.value = false
      return
    }

    if (!chartInstance) {
      chartInstance = echarts.init(host, undefined, { renderer: 'svg' })
    }
    chartInstance.setOption(option, true)
    await waitChartFinished(chartInstance)
    if (seq !== renderSeq) { return }
    chartReady.value = true
    zoom.value = 1
    pan.value = { x: 0, y: 0 }
    rendering.value = false
    await nextTick()
    captureSvgMarkup()
  } catch (err) {
    if (seq !== renderSeq) { return }
    disposeChart()
    renderError.value = err instanceof Error ? err.message : String(err)
  } finally {
    if (seq === renderSeq) { rendering.value = false }
  }
}

function onPointerDown(e: PointerEvent) {
  if (mode.value !== 'preview' || rendering.value || renderError.value || !chartReady.value) { return }
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
      disposeChart()
      renderError.value = ''
      rendering.value = false
      return
    }
    mode.value = 'preview'
    void renderPreview()
  },
  { immediate: true },
)

watch(
  () => [mode.value, sourceCode.value] as const,
  ([m]) => {
    if (m === 'preview' && !props.loading) { void renderPreview() }
  },
)

onMounted(() => {
  if (mode.value === 'preview' && !props.loading && !chartInstance) {
    void renderPreview()
  }
  if (typeof ResizeObserver === 'undefined') { return }
  resizeObserver = new ResizeObserver(() => {
    if (mode.value !== 'preview' || !chartInstance || renderError.value) { return }
    const box = previewEl.value
    if (!box || box.clientWidth <= 0) { return }
    layoutChartHost()
    chartInstance.resize()
    void nextTick(() => captureSvgMarkup())
  })
  if (previewEl.value) { resizeObserver.observe(previewEl.value) }
})

onBeforeUnmount(() => {
  renderSeq += 1
  resizeObserver?.disconnect()
  resizeObserver = null
  disposeChart()
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<style scoped>
.ms-echarts {
  margin: var(--ms-flow-diagram-y, 16px) 0;
  overflow: visible;
  background: #fff;
  border: 1px solid var(--diagram-border, #d0d7de);
  border-radius: 4px;
}

.ms-echarts__header {
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

.ms-echarts__toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px;
  background: #f6f8fa;
  border-radius: 6px;
}

.ms-echarts__toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
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

.ms-echarts__toggle-btn.is-active {
  color: #1f2328;
  background: #fff;
  box-shadow: 0 0 0 1px rgb(31 35 40 / 8%);
}

.ms-echarts__toggle-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.ms-echarts__actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ms-echarts__zoom {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  margin-left: 4px;
}

.ms-echarts__zoom-label {
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

.ms-echarts__icon-btn {
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

.ms-echarts__icon-btn svg,
.ms-echarts__toggle-btn svg {
  flex: none;
  width: 14px !important;
  height: 14px !important;
  overflow: visible;
}

.ms-echarts__icon-btn:hover:not(:disabled) {
  background: #f0f2f4;
}

.ms-echarts__icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.ms-echarts__source {
  overflow: hidden;
  border-radius: 0 0 4px 4px;
}

.ms-echarts__source :deep(.code-block-container) {
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
}

.ms-echarts__preview {
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

.ms-echarts__preview.is-dragging {
  cursor: grabbing;
}

.ms-echarts__canvas {
  flex: 0 0 auto;
  overflow: visible;
}

.ms-echarts__chart {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ms-echarts__loading,
.ms-echarts__error {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 120px;
  color: #59636e;
  font-size: 13px;
  background: #fff;
}

.ms-echarts__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgb(89 99 110 / 15%);
  border-top-color: rgb(89 99 110 / 80%);
  border-radius: 50%;
  animation: ms-echarts-spin 0.8s linear infinite;
}

@keyframes ms-echarts-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
