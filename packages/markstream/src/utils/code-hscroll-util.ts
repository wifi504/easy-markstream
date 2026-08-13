/** 悬浮横向滚动条：仅悬停显示，无箭头，底/左右各 4px（代码块 / 表格 / 公式块） */

const STYLE_ID = 'ms-code-hscroll-style'
const HOST_CLASS = 'ms-code-hscroll-host'
const BAR_CLASS = 'ms-code-hscroll'
const THUMB_CLASS = 'ms-code-hscroll__thumb'
const NATIVE_HIDE_CLASS = 'ms-code-hscroll-hide-native'
const BOUND = new WeakMap<HTMLElement, { scrollEl: HTMLElement, refresh: () => void, dispose: () => void }>()

/** 需要挂自定义条的滚动宿主 */
const HOST_SELECTOR = '.code-block-container, .table-node-wrapper, .math-block'

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
      right: ${INSET}px;
      bottom: ${INSET}px;
      left: ${INSET}px;
      z-index: 6;
      height: 6px;
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
      top: 0;
      height: 100%;
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

function resolveScrollEl(container: HTMLElement): HTMLElement | null {
  // 表格 / 公式块：容器自身横向滚动
  if (container.classList.contains('table-node-wrapper') || container.classList.contains('math-block')) { return container }

  const host = container.querySelector('diffs-container')
  const fromShadow = host?.shadowRoot?.querySelector('code, [data-code]')
  if (fromShadow instanceof HTMLElement) { return fromShadow }

  // 流式 Pre：横向滚动在 code 上（pre overflow:hidden 用于裁切行号）
  const code = container.querySelector('.markstream-pre__code')
  if (code instanceof HTMLElement) { return code }

  const pre = container.querySelector('pre[data-markstream-pre], .code-pre-fallback')
  if (pre instanceof HTMLElement) { return pre }

  const shell = container.querySelector('.code-block-shell-content, .code-editor-container')
  return shell instanceof HTMLElement ? shell : null
}

function bind(container: HTMLElement, scrollEl: HTMLElement) {
  ensureStyles()
  container.classList.add(HOST_CLASS)
  scrollEl.classList.add(NATIVE_HIDE_CLASS)

  /** 宿主即滚动层（表格/公式）时，条会跟着内容跑，需按 scrollLeft 钉在可视区 */
  const selfScroll = scrollEl === container

  let bar = container.querySelector<HTMLElement>(`:scope > .${BAR_CLASS}`)
  if (!bar) {
    bar = document.createElement('div')
    bar.className = BAR_CLASS
    bar.innerHTML = `<div class="${THUMB_CLASS}"></div>`
    container.appendChild(bar)
  }
  const thumb = bar.querySelector<HTMLElement>(`.${THUMB_CLASS}`)!

  let dragging = false
  let dragStartX = 0
  let dragStartScroll = 0

  const pinBarToViewport = () => {
    if (!selfScroll) {
      bar!.style.left = ''
      bar!.style.right = ''
      bar!.style.width = ''
      return
    }
    bar!.style.left = `${scrollEl.scrollLeft + INSET}px`
    bar!.style.right = 'auto'
    bar!.style.width = `${Math.max(0, scrollEl.clientWidth - INSET * 2)}px`
  }

  const refresh = () => {
    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
    const active = maxScroll > 1
    bar!.classList.toggle('is-active', active)
    pinBarToViewport()
    if (!active) {
      thumb.style.width = '0px'
      return
    }
    const track = bar!.clientWidth
    const ratio = scrollEl.clientWidth / scrollEl.scrollWidth
    const thumbW = Math.max(THUMB_MIN, Math.round(track * ratio))
    const maxThumbLeft = Math.max(0, track - thumbW)
    const left = maxScroll <= 0 ? 0 : (scrollEl.scrollLeft / maxScroll) * maxThumbLeft
    thumb.style.width = `${thumbW}px`
    thumb.style.transform = `translateX(${left}px)`
  }

  const onScroll = () => refresh()
  const onResize = () => refresh()

  scrollEl.addEventListener('scroll', onScroll, { passive: true })
  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(onResize)
    : null
  ro?.observe(scrollEl)
  if (scrollEl !== container) { ro?.observe(container) }

  const onThumbDown = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    dragStartX = e.clientX
    dragStartScroll = scrollEl.scrollLeft
    thumb.setPointerCapture(e.pointerId)
  }

  const onThumbMove = (e: PointerEvent) => {
    if (!dragging) { return }
    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
    const track = bar!.clientWidth
    const thumbW = thumb.offsetWidth
    const maxThumbLeft = Math.max(0, track - thumbW)
    if (maxScroll <= 0 || maxThumbLeft <= 0) { return }
    const dx = e.clientX - dragStartX
    scrollEl.scrollLeft = dragStartScroll + (dx / maxThumbLeft) * maxScroll
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
    const rect = bar!.getBoundingClientRect()
    const thumbW = thumb.offsetWidth
    const track = bar!.clientWidth
    const maxThumbLeft = Math.max(0, track - thumbW)
    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
    if (maxScroll <= 0 || maxThumbLeft <= 0) { return }
    const x = e.clientX - rect.left - thumbW / 2
    const ratio = Math.min(1, Math.max(0, x / maxThumbLeft))
    scrollEl.scrollLeft = ratio * maxScroll
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
    bar?.removeEventListener('pointerdown', onTrackDown)
    if (bar) {
      bar.style.left = ''
      bar.style.right = ''
      bar.style.width = ''
      bar.remove()
    }
    container.classList.remove(HOST_CLASS)
    scrollEl.classList.remove(NATIVE_HIDE_CLASS)
    BOUND.delete(container)
  }

  BOUND.set(container, { scrollEl, refresh, dispose })
}

function bindHost(node: HTMLElement, needRetry: { value: boolean }) {
  const scrollEl = resolveScrollEl(node)
  if (!scrollEl) {
    if (node.querySelector('diffs-container')) { needRetry.value = true }
    return
  }
  const existing = BOUND.get(node)
  if (existing) {
    if (existing.scrollEl !== scrollEl || !existing.scrollEl.isConnected) {
      existing.dispose()
      bind(node, scrollEl)
      return
    }
    existing.refresh()
    return
  }
  bind(node, scrollEl)
}

/** 扫描并挂载悬浮横向滚动条（代码块 / 表格 / 公式块） */
export function scanAndBindCodeHScroll(root: ParentNode = document) {
  ensureStyles()
  const needRetry = { value: false }
  const scope = root instanceof Element || root instanceof Document
    ? root
    : document

  scope.querySelectorAll?.(HOST_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) { bindHost(node, needRetry) }
  })

  if (needRetry.value) { window.setTimeout(() => scanAndBindCodeHScroll(document), 80) }
}

export function disposeAllCodeHScroll() {
  // WeakMap 无法遍历；依赖元素卸载即可。
}
