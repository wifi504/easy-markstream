/**
 * 判断代码块之后是否已有后续渲染内容。
 * 引用块内 fence 闭合后 loading 常仍为 true，但后续节点已出现 → 视为 settled。
 * 注意：blockquote 内还有嵌套 `.markstream-vue`，不能当停靠边界。
 */
export function hasRenderedContentAfter(el: HTMLElement | null | undefined): boolean {
  if (!el || typeof el.closest !== 'function') { return false }

  const stop = el.closest('.easy-markstream')
    ?? el.closest('main')
    ?? el.ownerDocument?.body
    ?? null

  let cur: HTMLElement | null = el

  while (cur && cur !== stop) {
    let sib = cur.nextElementSibling
    while (sib) {
      if ((sib.textContent || '').trim().length > 0) { return true }
      sib = sib.nextElementSibling
    }
    cur = cur.parentElement
  }

  return false
}

/** MutationObserver 挂载点：整篇 EasyMarkstream 根，而非嵌套 markstream 根 */
export function findStreamPaper(el: HTMLElement | null | undefined): HTMLElement | null {
  if (!el) { return null }
  return (el.closest('.easy-markstream') as HTMLElement | null)
    ?? (el.closest('main') as HTMLElement | null)
}
