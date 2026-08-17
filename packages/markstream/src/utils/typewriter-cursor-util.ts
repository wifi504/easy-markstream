/** markstream 在传入 `nodes` 时会关掉内置光标；此处复刻定位。 */

const SKIP_CLOSEST = [
  '.easy-markstream__typewriter-cursor',
  '.ms-md-link__bubble',
  '.ms-md-link__tip',
  'pre',
  '.code-block-container',
  '.ms-code-block',
  '.ms-mermaid',
  '.ms-echarts',
  '.katex',
  '.katex-display',
  'script',
  'style',
].join(',')

/** 末尾落在这些 AST 类型时，光标改文档流钉底（不跟上一处正文） */
const DOCK_NODE_TYPES = new Set([
  'code_block',
  'mermaid',
  'echarts',
  'table',
  'math_block',
  'image',
  'html_block',
  'thematic_break',
  'admonition',
])

function isUsableTextNode(node: Node): node is Text {
  if (node.nodeType !== Node.TEXT_NODE) { return false }
  if (!String(node.textContent || '').trim()) { return false }
  const parent = node.parentElement
  if (!parent) { return false }
  if (parent.closest(SKIP_CLOSEST)) { return false }
  return true
}

export function findLastStreamTextNode(root: ParentNode): Text | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  let current: Node | null = walker.nextNode()
  while (current) {
    if (isUsableTextNode(current)) { last = current }
    current = walker.nextNode()
  }
  return last
}

export interface TypewriterCursorBox {
  left: number
  top: number
  height: number
}

/** 文档末尾是否为需要「钉底」的块级节点 */
export function shouldDockTypewriterCursor(
  nodes: ReadonlyArray<{ type?: string }> | null | undefined,
): boolean {
  if (!nodes?.length) { return false }
  const last = nodes[nodes.length - 1]
  return DOCK_NODE_TYPES.has(String(last?.type || ''))
}

/** 相对 `root` 定位到最后一个可见正文文本末尾（块级请用 dock） */
export function measureTypewriterCursorBox(
  root: HTMLElement,
  scope: ParentNode,
): TypewriterCursorBox | null {
  const text = findLastStreamTextNode(scope)
  if (!text) { return null }

  const rootRect = root.getBoundingClientRect()
  const range = document.createRange()
  const len = text.length
  range.setStart(text, len)
  range.setEnd(text, len)
  const rect = range.getBoundingClientRect()
  if (!rect.height && !rect.width) { return null }

  return {
    left: rect.right - rootRect.left + root.scrollLeft,
    top: rect.top - rootRect.top + root.scrollTop,
    height: rect.height || 16,
  }
}
