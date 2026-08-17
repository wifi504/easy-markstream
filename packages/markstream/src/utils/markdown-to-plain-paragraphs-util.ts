/**
 * 将 markstream AST 抽成「记事本可见」纯文本段落：
 * 只要人看得见的字，不要 URL / 引用定义 / UI 壳。
 *
 * 换行规则：
 * - 单个 `\n` → 两个空格
 * - 连续换行 `\n\n+` → 字面量分段（渲染时用 ` | ` 连接，无空行）
 */

type AstNode = Record<string, any>

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n')
}

/**
 * 单换行变两空格；连续换行压成「一行一段」，不含空段。
 */
function splitByConsecutiveNewlines(text: string): string[] {
  const normalized = normalizeNewlines(text)
  if (!normalized.trim()) { return [] }
  return normalized
    .split(/\n{2,}/)
    .map(seg => seg.replace(/\n/g, '  ').trim())
    .filter(Boolean)
}

function inlineText(node: AstNode | undefined): string {
  if (!node) { return '' }

  const type = String(node.type || '')

  switch (type) {
    case 'text':
    case 'inline_code':
    case 'emoji':
      return String(node.content ?? node.raw ?? '')

    case 'softbreak':
      return ' '
    case 'hardbreak':
      // 单个换行，最终会被规范成两个空格
      return '\n'

    case 'link':
    case 'footnote_reference':
      if (Array.isArray(node.children) && node.children.length) { return node.children.map(inlineText).join('') }
      return String(node.text ?? node.content ?? '')

    case 'image':
      return String(node.alt ?? node.title ?? '')

    case 'math_inline':
      return String(node.content ?? '')

    case 'html_inline':
      return ''

    case 'checkbox':
    case 'checkbox_input':
      return ''

    case 'strong':
    case 'emphasis':
    case 'strikethrough':
    case 'highlight':
    case 'insert':
    case 'subscript':
    case 'superscript':
      return Array.isArray(node.children)
        ? node.children.map(inlineText).join('')
        : String(node.content ?? '')

    default:
      if (Array.isArray(node.children)) { return node.children.map(inlineText).join('') }
      return String(node.content ?? node.text ?? '')
  }
}

function childrenInline(node: AstNode): string {
  if (Array.isArray(node.children)) { return node.children.map(inlineText).join('') }
  return String(node.text ?? node.content ?? '')
}

function tableText(node: AstNode): string {
  const rows: AstNode[] = []
  if (node.header) { rows.push(node.header) }
  if (Array.isArray(node.rows)) { rows.push(...node.rows) } else if (Array.isArray(node.children)) { rows.push(...node.children.filter((c: AstNode) => c?.type === 'table_row')) }

  return rows.map((row) => {
    const cells = Array.isArray(row.cells)
      ? row.cells
      : (Array.isArray(row.children) ? row.children : [])
    return cells.map((cell: AstNode) => childrenInline(cell).trim()).filter(Boolean).join(' ')
  }).filter(Boolean).join('\n')
}

function listText(node: AstNode): string {
  const items = Array.isArray(node.items)
    ? node.items
    : (Array.isArray(node.children) ? node.children : [])
  return items.map((item: AstNode) => {
    if (Array.isArray(item.children)) {
      return item.children.map((child: AstNode) => {
        if (child?.type === 'paragraph' || child?.type === 'heading') { return childrenInline(child) }
        if (child?.type === 'list') { return listText(child) }
        return blockText(child)
      }).filter(Boolean).join('\n')
    }
    return childrenInline(item)
  }).filter(Boolean).join('\n')
}

function codeText(node: AstNode): string {
  const code = String(node.code ?? node.content ?? node.raw ?? '')
  // fence raw 有时含 ``` 包裹；优先 code 字段
  return code.replace(/\n$/, '')
}

/** 单个顶层块 → 原始可见文本（可含换行，稍后统一规范） */
function blockText(node: AstNode): string {
  const type = String(node.type || '')

  switch (type) {
    case 'thematic_break':
    case 'reference':
    case 'footnote_anchor':
      return ''

    case 'heading':
    case 'paragraph':
      return childrenInline(node)

    case 'blockquote':
      if (Array.isArray(node.children)) { return node.children.map(blockText).filter(Boolean).join('\n\n') }
      return childrenInline(node)

    case 'list':
      return listText(node)

    case 'code_block':
    case 'mermaid':
    case 'echarts':
      return codeText(node)

    case 'math_block':
      return String(node.content ?? '')

    case 'table':
      return tableText(node)

    case 'html_block':
      return ''

    case 'definition_list':
      if (Array.isArray(node.children)) { return node.children.map(blockText).filter(Boolean).join('\n\n') }
      return childrenInline(node)

    case 'image':
      return String(node.alt ?? node.title ?? '')

    default:
      if (Array.isArray(node.children)) {
        return node.children.map((c: AstNode) => {
          if (c?.type === 'text' || c?.type === 'link' || c?.type === 'strong') { return inlineText(c) }
          return blockText(c)
        }).filter(Boolean).join('')
      }
      return String(node.content ?? node.text ?? '')
  }
}

/**
 * AST nodes → 纯文本段落数组（空段丢弃）。
 * 调用方应已 stripIncompleteReferenceDefs，且不必 markParen。
 *
 * 换行：顶层块之间视为连续换行（最终只保留一次换行）；块内单换行变成两个空格。
 */
export function markdownNodesToPlainParagraphs(nodes: AstNode[] | null | undefined): string[] {
  if (!Array.isArray(nodes) || nodes.length === 0) { return [] }

  const chunks: string[] = []
  for (const node of nodes) {
    const text = normalizeNewlines(blockText(node)).trim()
    if (text) { chunks.push(text) }
  }

  // 顶层块之间用连续换行衔接，再按规则切开
  return splitByConsecutiveNewlines(chunks.join('\n\n'))
}
