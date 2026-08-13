/** 闭合后的虚拟横向滚动条：仅悬停显示；绑一次后不再随后续流式刷新 */

const STYLE_ID = 'ms-code-hscroll-style'
const HOST_CLASS = 'ms-code-hscroll-host'
const BAR_CLASS = 'ms-code-hscroll'
const THUMB_CLASS = 'ms-code-hscroll__thumb'
const NATIVE_HIDE_CLASS = 'ms-code-hscroll-hide-native'
const BOUND = new WeakMap<HTMLElement, Binding>()

const HOST_SELECTOR = '.code-block-container, .table-node-wrapper, .math-block'

const INSET = 4
const THUMB_MIN = 24

interface Binding {
  dispose: () => void
  refresh: () => void
}

function ensureStyles() {
  if (typeof document === 'undefined') { return }
  ensureHoverFallback()
  if (document.getElementById(STYLE_ID)) { return }
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

function maxScrollOf(el: HTMLElement) {
  return el.scrollWidth - el.clientWidth
}

/** 流式 Pre 不挂条；闭合后只认 diffs shadow 里真正横滑的 [data-code] */
function resolveScrollEls(container: HTMLElement): HTMLElement[] {
  if (container.classList.contains('table-node-wrapper') || container.classList.contains('math-block')) {
    return [container]
  }

  const host = container.querySelector('diffs-container')
  if (!(host instanceof HTMLElement)) { return [] }
  const root = host.shadowRoot
  if (!root) { return [] }
  const codes = [...root.querySelectorAll('[data-code]')].filter((n): n is HTMLElement => n instanceof HTMLElement)
  if (codes.length) { return codes }
  const fallback = root.querySelector('code')
  return fallback instanceof HTMLElement ? [fallback] : []
}

function stillStreaming(node: HTMLElement) {
  return node.getAttribute('data-markstream-code-block-state') === 'streaming'
    || !!node.closest('.is-streaming')
}

/** 静态首屏 diffs 晚于扫描：第一次划入未绑定的闭合块时再绑 */
function ensureHoverFallback() {
  if (typeof document === 'undefined' || (ensureHoverFallback as any)._on) { return }
  ;(ensureHoverFallback as any)._on = true
  document.addEventListener('pointerover', (e) => {
    const t = e.target
    if (!(t instanceof Element)) { return }
    const host = t.closest('.code-block-container')
    if (!(host instanceof HTMLElement) || BOUND.has(host) || stillStreaming(host)) { return }
    bindHost(host, { value: false })
  }, true)
}

function bind(container: HTMLElement, scrollEls: HTMLElement[]) {
  ensureStyles()
  container.classList.add(HOST_CLASS)

  let currents = scrollEls
  const selfScroll = () => currents.length === 1 && currents[0] === container

  const hideNative = (els: HTMLElement[]) => {
    for (const el of els) {
      el.classList.add(NATIVE_HIDE_CLASS)
    }
  }
  hideNative(currents)

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
  let dragStartRatio = 0

  const primary = () => {
    let best = currents[0]
    let bestMax = maxScrollOf(best)
    for (const el of currents) {
      const next = maxScrollOf(el)
      if (next > bestMax) {
        best = el
        bestMax = next
      }
    }
    return best
  }

  const applyRatio = (ratio: number) => {
    const r = Math.min(1, Math.max(0, ratio))
    for (const el of currents) {
      el.scrollLeft = r * maxScrollOf(el)
    }
  }

  const pinBarToViewport = () => {
    const current = primary()
    if (!selfScroll()) {
      bar!.style.left = ''
      bar!.style.right = ''
      bar!.style.width = ''
      return
    }
    bar!.style.left = `${current.scrollLeft + INSET}px`
    bar!.style.right = 'auto'
    bar!.style.width = `${Math.max(0, current.clientWidth - INSET * 2)}px`
  }

  const refresh = () => {
    if (!currents.length) { return }
    const current = primary()
    const maxScroll = maxScrollOf(current)
    const active = currents.some(el => maxScrollOf(el) > 1)
    bar!.classList.toggle('is-active', active)
    pinBarToViewport()
    if (!active) {
      thumb.style.width = '0px'
      return
    }
    const track = bar!.clientWidth
    const ratio = current.scrollWidth > 0 ? current.clientWidth / current.scrollWidth : 1
    const thumbW = Math.max(THUMB_MIN, Math.round(track * ratio))
    const maxThumbLeft = Math.max(0, track - thumbW)
    const left = maxScroll <= 0 ? 0 : Math.round((current.scrollLeft / maxScroll) * maxThumbLeft)
    thumb.style.width = `${thumbW}px`
    thumb.style.transform = `translateX(${left}px)`
  }

  const onScroll = () => refresh()

  const unbindScroll = () => {
    for (const el of currents) {
      el.removeEventListener('scroll', onScroll)
    }
  }

  const bindScroll = (els: HTMLElement[]) => {
    currents = els
    hideNative(currents)
    for (const el of currents) {
      el.addEventListener('scroll', onScroll, { passive: true })
    }
  }

  bindScroll(currents)

  /** 悬停时再量一次，并接上 diffs 可能换掉的 [data-code] */
  const syncEls = () => {
    const next = resolveScrollEls(container)
    if (!next.length) { return }
    const same = next.length === currents.length && next.every((el, i) => el === currents[i])
    if (same) { return }
    unbindScroll()
    bindScroll(next)
  }

  const onMouseEnter = () => {
    syncEls()
    refresh()
  }

  container.addEventListener('mouseenter', onMouseEnter)

  // 表格 / 公式：容器自身在长内容里会变宽，需要跟着量。
  const ro = typeof ResizeObserver !== 'undefined' && currents[0] === container
    ? new ResizeObserver(refresh)
    : null
  ro?.observe(container)

  const onThumbDown = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    syncEls()
    dragging = true
    dragStartX = e.clientX
    const current = primary()
    const max = maxScrollOf(current)
    dragStartRatio = max > 0 ? current.scrollLeft / max : 0
    thumb.setPointerCapture(e.pointerId)
  }

  const onThumbMove = (e: PointerEvent) => {
    if (!dragging) { return }
    const track = bar!.clientWidth
    const thumbW = thumb.offsetWidth
    const maxThumbLeft = Math.max(0, track - thumbW)
    if (maxThumbLeft <= 0) { return }
    applyRatio(dragStartRatio + (e.clientX - dragStartX) / maxThumbLeft)
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
    syncEls()
    const rect = bar!.getBoundingClientRect()
    const thumbW = thumb.offsetWidth
    const track = bar!.clientWidth
    const maxThumbLeft = Math.max(0, track - thumbW)
    if (maxThumbLeft <= 0) { return }
    const x = e.clientX - rect.left - thumbW / 2
    applyRatio(Math.min(1, Math.max(0, x / maxThumbLeft)))
  }

  thumb.addEventListener('pointerdown', onThumbDown)
  thumb.addEventListener('pointermove', onThumbMove)
  thumb.addEventListener('pointerup', onThumbUp)
  thumb.addEventListener('pointercancel', onThumbUp)
  bar.addEventListener('pointerdown', onTrackDown)

  requestAnimationFrame(() => {
    refresh()
    requestAnimationFrame(refresh)
  })

  const dispose = () => {
    unbindScroll()
    container.removeEventListener('mouseenter', onMouseEnter)
    ro?.disconnect()
    thumb.removeEventListener('pointerdown', onThumbDown)
    thumb.removeEventListener('pointermove', onThumbMove)
    thumb.removeEventListener('pointerup', onThumbUp)
    thumb.removeEventListener('pointercancel', onThumbUp)
    bar?.removeEventListener('pointerdown', onTrackDown)
    for (const el of currents) {
      el.classList.remove(NATIVE_HIDE_CLASS)
    }
    if (bar) {
      bar.style.left = ''
      bar.style.right = ''
      bar.style.width = ''
      bar.remove()
    }
    container.classList.remove(HOST_CLASS)
    BOUND.delete(container)
  }

  BOUND.set(container, { dispose, refresh })
}

function bindHost(node: HTMLElement, needRetry: { value: boolean }) {
  if (BOUND.has(node) || stillStreaming(node)) { return }
  const scrollEls = resolveScrollEls(node)
  if (!scrollEls.length) {
    if (node.classList.contains('code-block-container') && node.querySelector('diffs-container')) {
      needRetry.value = true
    }
    return
  }
  bind(node, scrollEls)
}

/** 针对单个 CodeBlock 根：等 diffs shadow 就绪再绑，避免静态 content 首屏扫空 */
export function bindCodeBlockHScroll(codeBlockRoot: HTMLElement) {
  if (typeof window === 'undefined') { return }
  let tries = 0
  const tick = () => {
    if (!codeBlockRoot.isConnected || codeBlockRoot.classList.contains('is-streaming')) { return }
    let ok = false
    codeBlockRoot.querySelectorAll('.code-block-container').forEach((node) => {
      if (!(node instanceof HTMLElement) || stillStreaming(node)) { return }
      bindHost(node, { value: false })
      if (BOUND.has(node)) { ok = true }
    })
    if (ok || tries++ >= 30) { return }
    window.setTimeout(tick, 80)
  }
  requestAnimationFrame(() => requestAnimationFrame(tick))
}

let scanTimer = 0
let retryLeft = 0

function scanNow() {
  ensureStyles()
  const needRetry = { value: false }
  document.querySelectorAll(HOST_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) { bindHost(node, needRetry) }
  })
  if (needRetry.value && retryLeft < 12) {
    retryLeft++
    scanTimer = window.setTimeout(() => {
      scanTimer = 0
      scanNow()
    }, 80)
    return
  }
  retryLeft = 0
}

/** 扫描未绑定的闭合代码块 / 表格 / 公式；已绑定的不再刷新 */
export function scanAndBindCodeHScroll(_root?: ParentNode) {
  if (typeof window === 'undefined') { return }
  if (scanTimer) { return }
  scanTimer = window.setTimeout(() => {
    scanTimer = 0
    retryLeft = 0
    scanNow()
  }, 80)
}

export function disposeAllCodeHScroll() {
  // WeakMap 无法遍历；依赖元素卸载即可。
}
