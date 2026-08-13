/**
 * 将「( + link + )」邻接结构标为 chip，并剥掉两侧括号。
 * 流式缺后括号时不打标。
 * 连续多个时：只消费 link，右括号残余文本留给下一轮作「前 text」。
 *
 * 引用尚未定义时，markdown-it 不会产出 link：
 * - 数字 id：`([Label]` + reference + `)`
 * - 命名 / 快捷 / 折叠：整段留在 text 里，如 `([Go][go-pkg])`、`([Google][])`、`([wiki])`
 * 上述也强制转成 chip（href 为空，由 MarkdownLink 显示转圈 / unknown）。
 */

type AstNode = Record<string, any>

function getText(node: AstNode): string {
  return String(node.content ?? node.raw ?? '')
}

function setText(node: AstNode, value: string) {
  if ('content' in node) { node.content = value }
  node.raw = value
}

function makeUnresolvedChip(label: string, refId = ''): AstNode {
  const text = label || 'unknown'
  return {
    type: 'link',
    chip: true,
    loading: false,
    href: '',
    title: '',
    text,
    children: [{ type: 'text', content: text, raw: text }],
    raw: refId ? `[${text}][${refId}]` : `[${text}]`,
  }
}

/** text 以 `([Label]` 结尾时取出 label */
function takeParenLabelSuffix(text: string): { left: string, label: string } | null {
  const m = text.match(/^(.*)\(\[([^\]]*)\]$/s)
  if (!m) { return null }
  return { left: m[1], label: m[2] }
}

/** 在同一层 children 上匹配 text( + link + )text */
function markParenAtLevel(children: AstNode[]): AstNode[] {
  if (!Array.isArray(children) || children.length < 3) { return children }

  const list = children.map(child => ({ ...child }))
  const out: AstNode[] = []

  for (let i = 0; i < list.length; i++) {
    const prev = list[i]
    const mid = list[i + 1]
    const next = list[i + 2]

    // 已解析链接：( + link + )
    if (
      prev?.type === 'text'
      && mid?.type === 'link'
      && next?.type === 'text'
      && getText(prev).endsWith('(')
      && getText(next).startsWith(')')
    ) {
      const left = getText(prev).slice(0, -1)
      const right = getText(next).slice(1)
      const prevNode = { ...prev }
      const linkNode = { ...mid, chip: true }
      setText(prevNode, left)
      setText(next, right)

      if (left) { out.push(prevNode) }
      out.push(linkNode)

      i += 1
      continue
    }

    // 未解析数字引用：([Label] + reference + )
    if (
      prev?.type === 'text'
      && mid?.type === 'reference'
      && next?.type === 'text'
      && getText(next).startsWith(')')
    ) {
      const taken = takeParenLabelSuffix(getText(prev))
      if (taken) {
        const right = getText(next).slice(1)
        const prevNode = { ...prev }
        setText(prevNode, taken.left)
        setText(next, right)

        if (taken.left) { out.push(prevNode) }
        out.push(makeUnresolvedChip(taken.label, String(mid.id ?? '')))

        i += 1
        continue
      }
    }

    if (prev?.type === 'text' && !getText(prev)) { continue }
    out.push(prev)
  }

  return out
}

/**
 * 命名引用等整段留在 text 时：拆出完整的 (\[...][...]?) 为未解析 chip。
 * 仅匹配已闭合的括号对。
 */
function expandUnresolvedChipsInText(children: AstNode[]): AstNode[] {
  if (!Array.isArray(children) || children.length === 0) { return children }

  const out: AstNode[] = []
  // ([label][id]) | ([label][]) | ([label])
  const re = /\(\[([^\]]+)\](?:\[([^\]]*)\])?\)/g

  for (const child of children) {
    if (child?.type !== 'text') {
      out.push(child)
      continue
    }

    const content = getText(child)
    if (!content.includes('([')) {
      out.push(child)
      continue
    }

    re.lastIndex = 0
    let last = 0
    let m: RegExpExecArray | null
    let matched = false
    while ((m = re.exec(content)) !== null) {
      matched = true
      const before = content.slice(last, m.index)
      if (before) {
        out.push({
          type: 'text',
          content: before,
          raw: before,
          center: child.center ?? false,
        })
      }
      const label = m[1]
      const refId = m[2] !== undefined ? m[2] : label
      out.push(makeUnresolvedChip(label, refId))
      last = m.index + m[0].length
    }

    if (!matched) {
      out.push(child)
      continue
    }

    const rest = content.slice(last)
    if (rest) {
      out.push({
        type: 'text',
        content: rest,
        raw: rest,
        center: child.center ?? false,
      })
    }
  }

  return out
}

function processNode(node: AstNode): AstNode {
  if (!Array.isArray(node.children)) { return node }

  const children = (node.children as AstNode[]).map(processNode)
  const withParenChips = markParenAtLevel(children)
  return {
    ...node,
    children: expandUnresolvedChipsInText(withParenChips),
  }
}

export function markParenWrappedLinks<T extends AstNode>(nodes: T[]): T[] {
  return nodes.map(n => processNode(n)) as T[]
}
