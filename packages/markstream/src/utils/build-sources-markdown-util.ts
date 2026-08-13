import type { MarkdownReferenceItem } from './collect-markdown-references-util'
import { resolveLinkLabel } from './link-label-util'

function escapeLinkText(text: string): string {
  return text.replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function escapeHref(href: string): string {
  return href.replace(/[()\s]/g, ch => encodeURIComponent(ch))
}

/** refs → 无序列表 + 普通行内链接，供来源气泡内 EasyMarkstream 渲染 */
export function buildSourcesMarkdown(items: MarkdownReferenceItem[]): string {
  if (!items.length) { return '' }

  return items.map((item) => {
    const label = resolveLinkLabel({
      text: '',
      title: item.title,
      href: item.href,
    })
    return `- [${escapeLinkText(label)}](${escapeHref(item.href)})`
  }).join('\n')
}
