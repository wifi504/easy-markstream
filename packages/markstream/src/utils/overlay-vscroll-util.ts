/** 悬浮纵向滚动条：仅悬停显示，无上下箭头（来源 tip 等） */

const STYLE_ID = 'ms-overlay-vscroll-style'
const HOST_CLASS = 'ms-overlay-vscroll-host'
const BAR_CLASS = 'ms-overlay-vscroll'
const THUMB_CLASS = 'ms-overlay-vscroll__thumb'
const NATIVE_HIDE_CLASS = 'ms-overlay-vscroll-hide-native'
const BOUND = new WeakMap<HTMLElement, { refresh: () => void, dispose: () => void }>()

const INSET = 4
const THUMB_MIN = 24

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) { return }
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${HOST_CLASS} {
      position: relative;
    }

    .${BAR_CLASS} {
      position: absolute;
      top: ${INSET}px;
      right: ${INSET}px;
      bottom: ${INSET}px;
      z-index: 6;
      width: 6px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .${HOST_CLASS}:hover .${BAR_CLASS}.is-active {
      pointer-events: auto;
      opacity: 1;
    }

    .${THUMB_CLASS} {
      position: absolute;
      left: 0;
      width: 100%;
      background: rgba(31, 35, 40, 0.28);
      border-radius: 999px;
      cursor: grab;
    }

    .${THUMB_CLASS}:hover {
      background: rgba(31, 35, 40, 0.4);
    }

    .${THUMB_CLASS}:active {
      cursor: grabbing;
      background: rgba(31, 35, 40, 0.48);
    }

    .${NATIVE_HIDE_CLASS} {
      scrollbar-width: none !important;
    }

    .${NATIVE_HIDE_CLASS}::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
      background: transparent !important;
    }

    .${NATIVE_HIDE_CLASS}::-webkit-scrollbar-button,
    .${NATIVE_HIDE_CLASS}::-webkit-scrollbar-button:start:decrement,
    .${NATIVE_HIDE_CLASS}::-webkit-scrollbar-button:end:increment {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
  `
  document.head.appendChild(style)
}

/** 宿主自身纵向滚动时挂自定义条 */
export function bindOverlayVScroll(scrollEl: HTMLElement) {
  ensureStyles()
  const existing = BOUND.get(scrollEl)
  if (existing) {
    existing.refresh()
    return existing
  }

  scrollEl.classList.add(HOST_CLASS, NATIVE_HIDE_CLASS)

  const bar = document.createElement('div')
  bar.className = BAR_CLASS
  bar.innerHTML = `<div class="${THUMB_CLASS}"></div>`
  scrollEl.appendChild(bar)
  const thumb = bar.querySelector<HTMLElement>(`.${THUMB_CLASS}`)!

  let dragging = false
  let dragStartY = 0
  let dragStartScroll = 0

  const pinBarToViewport = () => {
    // 宿主即滚动层：条随 scrollTop 钉在可视区右侧
    bar.style.top = `${scrollEl.scrollTop + INSET}px`
    bar.style.bottom = 'auto'
    bar.style.height = `${Math.max(0, scrollEl.clientHeight - INSET * 2)}px`
  }

  const refresh = () => {
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
    const active = maxScroll > 1
    bar.classList.toggle('is-active', active)
    pinBarToViewport()
    if (!active) {
      thumb.style.height = '0px'
      return
    }
    const track = bar.clientHeight
    const ratio = scrollEl.clientHeight / scrollEl.scrollHeight
    const thumbH = Math.max(THUMB_MIN, Math.round(track * ratio))
    const maxThumbTop = Math.max(0, track - thumbH)
    const top = maxScroll <= 0 ? 0 : (scrollEl.scrollTop / maxScroll) * maxThumbTop
    thumb.style.height = `${thumbH}px`
    thumb.style.transform = `translateY(${top}px)`
  }

  const onScroll = () => refresh()
  scrollEl.addEventListener('scroll', onScroll, { passive: true })
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => refresh())
    : null
  ro?.observe(scrollEl)

  const onThumbDown = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    dragStartY = e.clientY
    dragStartScroll = scrollEl.scrollTop
    thumb.setPointerCapture(e.pointerId)
  }

  const onThumbMove = (e: PointerEvent) => {
    if (!dragging) { return }
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
    const track = bar.clientHeight
    const thumbH = thumb.offsetHeight
    const maxThumbTop = Math.max(0, track - thumbH)
    if (maxScroll <= 0 || maxThumbTop <= 0) { return }
    const dy = e.clientY - dragStartY
    scrollEl.scrollTop = dragStartScroll + (dy / maxThumbTop) * maxScroll
  }

  const onThumbUp = (e: PointerEvent) => {
    if (!dragging) { return }
    dragging = false
    try {
      thumb.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const onTrackDown = (e: PointerEvent) => {
    if (e.target !== bar) { return }
    const rect = bar.getBoundingClientRect()
    const thumbH = thumb.offsetHeight
    const track = bar.clientHeight
    const maxThumbTop = Math.max(0, track - thumbH)
    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight
    if (maxScroll <= 0 || maxThumbTop <= 0) { return }
    const y = e.clientY - rect.top - thumbH / 2
    const ratio = Math.min(1, Math.max(0, y / maxThumbTop))
    scrollEl.scrollTop = ratio * maxScroll
  }

  thumb.addEventListener('pointerdown', onThumbDown)
  thumb.addEventListener('pointermove', onThumbMove)
  thumb.addEventListener('pointerup', onThumbUp)
  thumb.addEventListener('pointercancel', onThumbUp)
  bar.addEventListener('pointerdown', onTrackDown)

  refresh()

  const dispose = () => {
    scrollEl.removeEventListener('scroll', onScroll)
    ro?.disconnect()
    thumb.removeEventListener('pointerdown', onThumbDown)
    thumb.removeEventListener('pointermove', onThumbMove)
    thumb.removeEventListener('pointerup', onThumbUp)
    thumb.removeEventListener('pointercancel', onThumbUp)
    bar.removeEventListener('pointerdown', onTrackDown)
    bar.remove()
    scrollEl.classList.remove(HOST_CLASS, NATIVE_HIDE_CLASS)
    BOUND.delete(scrollEl)
  }

  const binding = { refresh, dispose }
  BOUND.set(scrollEl, binding)
  return binding
}

export function unbindOverlayVScroll(scrollEl: HTMLElement | null | undefined) {
  if (!scrollEl) { return }
  BOUND.get(scrollEl)?.dispose()
}
