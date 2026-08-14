<template>
  <teleport to="body">
    <transition name="ms-image-lb-fade" appear @after-leave="onAfterLeave">
      <div
        v-if="open"
        ref="rootEl"
        class="ms-image-lb"
        role="dialog"
        aria-modal="true"
        :aria-label="titleText"
        @pointerdown="onRootPointerDown"
        @click="onRootClick"
      >
        <div
          class="ms-image-lb__stage"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <img
            class="ms-image-lb__img"
            :class="{ 'is-dragging': dragging }"
            :src="src"
            :alt="titleText"
            draggable="false"
            :style="imgStyle"
          >
        </div>

        <div class="ms-image-lb__dock" @pointerdown.stop @click.stop>
          <div class="ms-image-lb__bar">
            <span class="ms-image-lb__name" :title="titleText">{{ titleText }}</span>

            <span class="ms-image-lb__sep" aria-hidden="true" />

            <button type="button" class="ms-image-lb__btn" aria-label="缩小" @click="zoomBy(-1)">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M3.5 7.25a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75" />
              </svg>
            </button>
            <button
              type="button"
              class="ms-image-lb__zoom"
              aria-label="重置为 100% 并居中"
              title="重置为 100% 并居中"
              @click="resetZoom"
            >
              {{ zoomLabel }}
            </button>
            <button type="button" class="ms-image-lb__btn" aria-label="放大" @click="zoomBy(1)">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M8 2.75a.75.75 0 0 1 .75.75v3.75h3.75a.75.75 0 0 1 0 1.5H8.75v3.75a.75.75 0 0 1-1.5 0V8.75H3.5a.75.75 0 0 1 0-1.5h3.75V3.5A.75.75 0 0 1 8 2.75" />
              </svg>
            </button>

            <span class="ms-image-lb__sep" aria-hidden="true" />

            <button
              type="button"
              class="ms-image-lb__btn"
              :class="{ 'is-spin-ccw': spinCcw }"
              aria-label="向左旋转"
              @click="rotateBy(-90)"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M8 1.5V0a.75.75 0 0 0-1.28-.53l-2.5 2.5a.75.75 0 0 0 0 1.06l2.5 2.5A.75.75 0 0 0 8 4.75V3a5 5 0 1 1-4.86 6.21.75.75 0 1 0-1.46.34A6.5 6.5 0 1 0 8 1.5Z" />
              </svg>
            </button>
            <button
              type="button"
              class="ms-image-lb__btn"
              :class="{ 'is-spin-cw': spinCw }"
              aria-label="向右旋转"
              @click="rotateBy(90)"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 6.32 8.05.75.75 0 1 0-1.46-.34A5 5 0 1 1 8 3v1.75a.75.75 0 0 0 1.28.53l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5A.75.75 0 0 0 8 0v1.5Z" />
              </svg>
            </button>

            <span class="ms-image-lb__sep" aria-hidden="true" />

            <button
              type="button"
              class="ms-image-lb__btn"
              :aria-label="downloadHint || '下载'"
              :disabled="downloading"
              @click="download"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M8.75 2.75a.75.75 0 0 0-1.5 0v6.19L5.03 6.72a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 1 0-1.06-1.06L8.75 8.94V2.75ZM2.75 12.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H2.75Z" />
              </svg>
            </button>
            <button type="button" class="ms-image-lb__btn" aria-label="关闭" @click="requestClose">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
          <p class="ms-image-lb__hint">
            {{ downloadHint || 'Ctrl + 滚轮 缩放图片，单击空白处关闭' }}
          </p>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  src: string
  titleText: string
}>()

const emit = defineEmits<{
  close: []
}>()

const open = ref(true)
const rootEl = ref<HTMLElement | null>(null)
const scale = ref(1)
const rotate = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)
const dragging = ref(false)
const dragMoved = ref(false)
const suppressClick = ref(false)
const dragStart = ref({ x: 0, y: 0, ox: 0, oy: 0 })
const downloading = ref(false)
const downloadHint = ref('')
const spinCcw = ref(false)
const spinCw = ref(false)
let hintTimer: ReturnType<typeof setTimeout> | null = null
let spinCcwTimer: ReturnType<typeof setTimeout> | null = null
let spinCwTimer: ReturnType<typeof setTimeout> | null = null
let prevBodyOverflow = ''
let pointerOnBackdrop = false

/** 10% ~ 1600% */
const SCALE_MIN = 0.1
const SCALE_MAX = 16
/** 工具栏按钮每档相对倍率 */
const ZOOM_STEP = 1.1
/** Ctrl+滚轮：scale *= exp(-deltaY * k)，等距滚轮 → 等比缩放 */
const WHEEL_ZOOM_K = 0.0022

const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)

const imgStyle = computed((): CSSProperties => ({
  transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px)) scale(${scale.value}) rotate(${rotate.value}deg)`,
}))

function clampScale(value: number) {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, value))
}

function requestClose() {
  if (!open.value) { return }
  open.value = false
}

function onAfterLeave() {
  emit('close')
}

function zoomBy(direction: number) {
  const next = direction > 0
    ? scale.value * ZOOM_STEP
    : scale.value / ZOOM_STEP
  scale.value = Number(clampScale(next).toFixed(4))
}

function resetZoom() {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

function rotateBy(deg: number) {
  rotate.value += deg
  if (deg < 0) {
    spinCcw.value = false
    void nextTick(() => {
      spinCcw.value = true
      if (spinCcwTimer) { clearTimeout(spinCcwTimer) }
      spinCcwTimer = setTimeout(() => {
        spinCcw.value = false
        spinCcwTimer = null
      }, 320)
    })
  } else {
    spinCw.value = false
    void nextTick(() => {
      spinCw.value = true
      if (spinCwTimer) { clearTimeout(spinCwTimer) }
      spinCwTimer = setTimeout(() => {
        spinCw.value = false
        spinCwTimer = null
      }, 320)
    })
  }
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.ctrlKey) {
    scale.value = Number(clampScale(scale.value * Math.exp(-e.deltaY * WHEEL_ZOOM_K)).toFixed(4))
    return
  }
  offsetY.value -= e.deltaY
}

function isBackdropTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) { return false }
  if (target.closest('.ms-image-lb__dock')) { return false }
  if (target.closest('.ms-image-lb__img')) { return false }
  return !!target.closest('.ms-image-lb')
}

function onRootPointerDown(e: PointerEvent) {
  pointerOnBackdrop = isBackdropTarget(e.target)
}

function onRootClick() {
  if (suppressClick.value || dragMoved.value || dragging.value) { return }
  if (!pointerOnBackdrop) { return }
  requestClose()
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) { return }
  const target = e.target as HTMLElement | null
  if (!target?.closest('.ms-image-lb__img')) { return }
  dragging.value = true
  dragMoved.value = false
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    ox: offsetX.value,
    oy: offsetY.value,
  }
  ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!dragging.value) { return }
  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y
  if (Math.hypot(dx, dy) > 3) { dragMoved.value = true }
  offsetX.value = dragStart.value.ox + dx
  offsetY.value = dragStart.value.oy + dy
}

function onPointerUp(e: PointerEvent) {
  if (!dragging.value) { return }
  const moved = dragMoved.value
  dragging.value = false
  ;(e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(e.pointerId)
  if (moved) {
    suppressClick.value = true
    // 吃掉拖拽结束后紧随的 click，避免误关
    window.setTimeout(() => {
      suppressClick.value = false
      dragMoved.value = false
    }, 120)
  }
}

function extFromUrl(url: string) {
  try {
    const last = new URL(url, typeof location !== 'undefined' ? location.href : undefined)
      .pathname
      .split('/')
      .filter(Boolean)
      .pop() || ''
    const m = last.match(/\.([a-z0-9]{2,5})$/i)
    if (m) { return m[1].toLowerCase() }
  } catch {
    // ignore
  }
  return ''
}

function extFromMime(type: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
  }
  return map[type] || ''
}

/** 下载文件名 = 控件栏名称；扩展名从 URL / MIME 补齐 */
function downloadFilename(blob: Blob) {
  const raw = String(props.titleText || '图片').trim() || '图片'
  // 文件名非法字符含控制字符
  // eslint-disable-next-line no-control-regex -- 故意去掉 C0 控制符
  const base = raw.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, ' ')
  if (/\.[a-z0-9]{2,5}$/i.test(base)) { return base }
  const ext = extFromUrl(props.src) || extFromMime(blob.type) || 'png'
  return `${base}.${ext}`
}

function showDownloadFail() {
  downloadHint.value = '下载失败'
  if (hintTimer) { clearTimeout(hintTimer) }
  hintTimer = setTimeout(() => {
    downloadHint.value = ''
    hintTimer = null
  }, 2000)
}

async function download() {
  if (!props.src || downloading.value) { return }
  downloading.value = true
  try {
    const res = await fetch(props.src, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) { throw new Error(`HTTP ${res.status}`) }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = downloadFilename(blob)
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    showDownloadFail()
  } finally {
    downloading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { requestClose() }
}

watch(rootEl, (el, prev) => {
  prev?.removeEventListener('wheel', onWheel)
  el?.addEventListener('wheel', onWheel, { passive: false })
})

onMounted(() => {
  prevBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.body.style.overflow = prevBodyOverflow
  window.removeEventListener('keydown', onKeydown)
  rootEl.value?.removeEventListener('wheel', onWheel)
  if (hintTimer) { clearTimeout(hintTimer) }
  if (spinCcwTimer) { clearTimeout(spinCcwTimer) }
  if (spinCwTimer) { clearTimeout(spinCwTimer) }
})
</script>

<style scoped>
.ms-image-lb {
  position: fixed;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  background: rgb(15 18 22 / 72%);
  user-select: none;
  touch-action: none;
  inset: 0;
}

.ms-image-lb__stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  cursor: default;
}

.ms-image-lb__img {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: min(92vw, 100%);
  max-height: min(70vh, 100%);
  margin: 0;
  transform-origin: center center;
  cursor: grab;
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: auto;
  will-change: transform;
}

.ms-image-lb__img.is-dragging {
  cursor: grabbing;
  transition: none;
}

.ms-image-lb__dock {
  position: absolute;
  bottom: 12.5vh;
  left: 50%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  max-width: min(920px, calc(100vw - 24px));
  transform: translateX(-50%);
}

.ms-image-lb__bar {
  display: flex;
  gap: 4px;
  align-items: center;
  box-sizing: border-box;
  max-width: 100%;
  padding: 6px 8px;
  color: #f6f8fa;
  background: rgb(31 35 40 / 72%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 4px;
  backdrop-filter: blur(6px);
}

.ms-image-lb__name {
  max-width: 180px;
  padding: 0 6px;
  overflow: hidden;
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ms-image-lb__zoom {
  box-sizing: border-box;
  min-width: 54px;
  height: 28px;
  padding: 0 4px;
  color: inherit;
  font: inherit;
  font-size: 12px;
  line-height: 28px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.ms-image-lb__zoom:hover {
  background: rgb(255 255 255 / 10%);
}

.ms-image-lb__sep {
  flex-shrink: 0;
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: rgb(255 255 255 / 18%);
}

.ms-image-lb__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.ms-image-lb__btn svg {
  display: block;
}

.ms-image-lb__btn:hover:not(:disabled) {
  background: rgb(255 255 255 / 10%);
}

.ms-image-lb__btn:disabled {
  cursor: default;
  opacity: 0.45;
}

.ms-image-lb__btn.is-spin-cw svg {
  animation: ms-image-lb-spin-cw 0.32s ease;
}

.ms-image-lb__btn.is-spin-ccw svg {
  animation: ms-image-lb-spin-ccw 0.32s ease;
}

.ms-image-lb__hint {
  margin: 0;
  color: rgb(246 248 250 / 78%);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}

.ms-image-lb-fade-enter-active,
.ms-image-lb-fade-leave-active {
  transition: opacity 0.22s ease;
}

.ms-image-lb-fade-enter-from,
.ms-image-lb-fade-leave-to {
  opacity: 0;
}

@keyframes ms-image-lb-spin-cw {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(90deg);
  }
}

@keyframes ms-image-lb-spin-ccw {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-90deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ms-image-lb__img {
    transition: none;
  }

  .ms-image-lb-fade-enter-active,
  .ms-image-lb-fade-leave-active {
    transition: none;
  }

  .ms-image-lb__btn.is-spin-cw svg,
  .ms-image-lb__btn.is-spin-ccw svg {
    animation: none;
  }
}
</style>
