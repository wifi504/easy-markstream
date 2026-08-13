/** 链接展示文案 / 域名兜底 */

export function hostnameFromHref(href: string): string {
  try {
    const base = typeof location !== 'undefined' ? location.href : 'https://localhost/'
    const u = new URL(href, base)
    return u.hostname || href
  } catch {
    return href
  }
}

/** 文本是否看起来像 URL（用于 chip / 来源文案兜底） */
export function looksLikeUrl(text: string): boolean {
  const t = text.trim()
  if (!t) { return false }
  if (/^https?:\/\//i.test(t)) { return true }
  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(t)) { return true }
  return false
}

/**
 * 文案兜底：写了字且非纯 URL > title > 域名
 */
export function resolveLinkLabel(opts: {
  text?: string | null
  title?: string | null
  href: string
}): string {
  const text = String(opts.text ?? '').trim()
  if (text && !looksLikeUrl(text)) { return text }
  const title = String(opts.title ?? '').trim()
  if (title) { return title }
  return hostnameFromHref(opts.href) || text || opts.href || 'link'
}

export function faviconCandidatesForHref(href: string): string[] {
  if (!href) { return [] }
  try {
    const base = typeof location !== 'undefined' ? location.href : 'https://localhost/'
    const u = new URL(href, base)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') { return [] }
    const host = u.hostname
    const origin = u.origin
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`,
      `https://icons.duckduckgo.com/ip3/${host}.ico`,
      `${origin}/favicon.svg`,
      `${origin}/favicon.ico`,
    ]
  } catch {
    return []
  }
}
