/** 气泡相对视口的定位 / 避让（fixed + Teleport，避免被 overflow 裁切） */

export const POPOVER_EDGE_PAD = 8
export const POPOVER_GAP = 6

export type PopoverPlacement = 'top' | 'bottom'

const HORIZONTAL_HOSTS = [
  '.ms-mermaid',
  '.code-block-container',
  '.easy-markstream',
] as const

export interface PopoverBoundary {
  minL: number
  maxR: number
  minT: number
  maxB: number
}

export interface FixedPopoverPosition {
  placement: PopoverPlacement
  left: number
  top: number
  /** 箭头相对气泡左边缘的 x */
  arrowOffsetX: number
}

/** 最近可纵向滚动祖先；找不到则回退 .easy-markstream */
function findScrollHost(el: HTMLElement): HTMLElement | null {
  let cur: HTMLElement | null = el.parentElement
  while (cur) {
    const { overflowY } = getComputedStyle(cur)
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
      && cur.scrollHeight > cur.clientHeight + 1
    ) {
      return cur
    }
    cur = cur.parentElement
  }
  return el.closest('.easy-markstream') as HTMLElement | null
}

/** 可见区：优先滚动容器；水平可再收紧到就近卡片 / 组件根 */
export function findPopoverBoundary(el: HTMLElement): PopoverBoundary {
  const scroll = findScrollHost(el)
  const scrollRect = scroll?.getBoundingClientRect()

  const minT = (scrollRect?.top ?? 0) + POPOVER_EDGE_PAD
  const maxB = (scrollRect?.bottom ?? window.innerHeight) - POPOVER_EDGE_PAD

  let minL = POPOVER_EDGE_PAD
  let maxR = window.innerWidth - POPOVER_EDGE_PAD

  for (const sel of HORIZONTAL_HOSTS) {
    const box = el.closest(sel) as HTMLElement | null
    if (!box) { continue }
    const rect = box.getBoundingClientRect()
    if (sel === '.easy-markstream') {
      const style = getComputedStyle(box)
      const padL = Number.parseFloat(style.paddingLeft) || 0
      const padR = Number.parseFloat(style.paddingRight) || 0
      minL = rect.left + padL + POPOVER_EDGE_PAD
      maxR = rect.right - padR - POPOVER_EDGE_PAD
    } else {
      minL = rect.left + POPOVER_EDGE_PAD
      maxR = rect.right - POPOVER_EDGE_PAD
    }
    break
  }

  return { minL, maxR, minT, maxB }
}

function spaceFor(
  triggerRect: DOMRect,
  boundary: Pick<PopoverBoundary, 'minT' | 'maxB'>,
) {
  return {
    above: triggerRect.top - boundary.minT,
    below: boundary.maxB - triggerRect.bottom,
  }
}

export function resolvePopoverPlacement(
  triggerRect: DOMRect,
  tipHeight: number,
  boundary: Pick<PopoverBoundary, 'minT' | 'maxB'>,
  preferred: PopoverPlacement = 'top',
): PopoverPlacement {
  const need = tipHeight + POPOVER_GAP + POPOVER_EDGE_PAD
  const { above, below } = spaceFor(triggerRect, boundary)

  if (preferred === 'top') {
    if (above >= need) { return 'top' }
    if (below >= need) { return 'bottom' }
    return below > above ? 'bottom' : 'top'
  }

  if (below >= need) { return 'bottom' }
  if (above >= need) { return 'top' }
  return above > below ? 'top' : 'bottom'
}

/**
 * 计算 fixed 气泡坐标：上下翻转 + 左右夹紧。
 * 若上方会压到组件顶边（首行极端场景），强制改到下方。
 */
export function computeFixedPopoverPosition(options: {
  triggerRect: DOMRect
  tipWidth: number
  tipHeight: number
  boundary: PopoverBoundary
  preferred?: PopoverPlacement
  gap?: number
  triggerEl?: HTMLElement | null
}): FixedPopoverPosition {
  const {
    triggerRect,
    tipWidth,
    tipHeight,
    boundary,
    preferred = 'top',
    gap = POPOVER_GAP,
    triggerEl = null,
  } = options

  let placement = resolvePopoverPlacement(triggerRect, tipHeight, boundary, preferred)
  const triggerCenterX = triggerRect.left + triggerRect.width / 2

  let left = triggerCenterX - tipWidth / 2
  if (left < boundary.minL) { left = boundary.minL }
  if (left + tipWidth > boundary.maxR) { left = boundary.maxR - tipWidth }
  if (left < boundary.minL) { left = boundary.minL }

  const topFor = (p: PopoverPlacement) =>
    p === 'top'
      ? triggerRect.top - gap - tipHeight
      : triggerRect.bottom + gap

  let top = topFor(placement)

  const paper = triggerEl?.closest('.easy-markstream') as HTMLElement | null
  if (placement === 'top' && paper) {
    const paperTop = paper.getBoundingClientRect().top
    if (top < paperTop + POPOVER_EDGE_PAD) {
      const below = boundary.maxB - triggerRect.bottom
      if (below >= tipHeight + gap) {
        placement = 'bottom'
        top = topFor('bottom')
      }
    }
  }

  if (placement === 'top' && top < boundary.minT) {
    placement = 'bottom'
    top = topFor('bottom')
  } else if (placement === 'bottom' && top + tipHeight > boundary.maxB) {
    placement = 'top'
    top = topFor('top')
  }

  if (top < boundary.minT) { top = boundary.minT }
  if (top + tipHeight > boundary.maxB) { top = Math.max(boundary.minT, boundary.maxB - tipHeight) }

  const arrowOffsetX = Math.min(
    Math.max(triggerCenterX - left, 10),
    Math.max(tipWidth - 10, 10),
  )

  return {
    placement,
    left: Math.round(left),
    top: Math.round(top),
    arrowOffsetX: Math.round(arrowOffsetX),
  }
}
