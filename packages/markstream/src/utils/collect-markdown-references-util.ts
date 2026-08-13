export interface MarkdownReferenceItem {
  /** 规范化后的 id（如 GO-PKG） */
  id: string
  href: string
  title: string
}

type RefMap = Record<string, { href?: string, title?: string }>

interface MarkdownLike {
  parse: (src: string, env?: Record<string, unknown>) => unknown
}

/** 与 markdown-it normalizeReference 一致：空白折叠 + 大写 */
function normalizeReferenceLabel(label: string): string {
  return label.replace(/\s+/g, ' ').trim().toUpperCase()
}

/**
 * 按源码中 `[id]: url` 定义行的出现顺序收集 label。
 * 不能依赖 Object.keys(env.references)：整型 key 会被 JS 排到前面。
 * 跳过 fenced code，避免示例定义干扰顺序。
 */
function definitionOrderInSource(content: string): string[] {
  const order: string[] = []
  const seen = new Set<string>()
  const defRe = /^[ \t]{0,3}\[([^\]]+)\]:[ \t]+\S+/
  const fenceOpenRe = /^[ \t]{0,3}(`{3,}|~{3,})/
  let fenceChar: '`' | '~' | null = null
  let fenceLen = 0

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, '')
    const fence = fenceOpenRe.exec(line)
    const fenceInfo = fence ? line.slice(fence[0].length) : ''
    if (fenceChar) {
      // 闭合：同字符、长度 ≥ 开启、无 info string
      if (
        fence
        && fence[1][0] === fenceChar
        && fence[1].length >= fenceLen
        && !fenceInfo.trim()
      ) {
        fenceChar = null
        fenceLen = 0
      }
      continue
    }
    if (fence) {
      fenceChar = fence[1][0] as '`' | '~'
      fenceLen = fence[1].length
      continue
    }
    const m = defRe.exec(line)
    if (!m) { continue }
    const id = normalizeReferenceLabel(m[1] || '')
    if (!id || seen.has(id)) { continue }
    seen.add(id)
    order.push(id)
  }
  return order
}

/**
 * 从 markdown-it env.references 收集引用定义，按文档中定义出现顺序排序。
 */
export function collectMarkdownReferences(
  md: MarkdownLike,
  content: string,
): MarkdownReferenceItem[] {
  const src = content || ''
  const env: { references?: RefMap } = {}
  md.parse(src, env)
  const map = env.references
  if (!map) { return [] }

  const byId = new Map<string, MarkdownReferenceItem>()
  for (const [id, value] of Object.entries(map)) {
    const href = String(value?.href ?? '').trim()
    if (!href) { continue }
    const normId = normalizeReferenceLabel(id)
    byId.set(normId, {
      id: normId,
      href,
      title: String(value?.title ?? '').trim(),
    })
  }

  const ordered: MarkdownReferenceItem[] = []
  const used = new Set<string>()
  for (const id of definitionOrderInSource(src)) {
    const item = byId.get(id)
    if (!item) { continue }
    ordered.push(item)
    used.add(id)
  }

  // 兜底：解析到但不在源码扫描中的项（极少见）按原 map 顺序追加
  for (const [id, item] of byId) {
    if (!used.has(id)) { ordered.push(item) }
  }

  return ordered
}
