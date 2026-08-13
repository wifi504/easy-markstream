/**
 * 剥离流式未完成的引用定义段落，避免 `[id]: url "tit` 露馅，
 * 以及 `[` / `[1001` 未闭合阶段闪一下空行/残片。
 * 完整定义本身不进 AST；仅清理 parse 失败后的 paragraph。
 */

type AstNode = Record<string, any>

/** 已写出 `]:` 的引用定义（含标题未闭合） */
const REF_DEF_RAW_RE = /^\[[^\]]+\]:\s*/

/** 仅有未闭合 label：`[` / `[1001` */
const UNCLOSED_REF_LABEL_RE = /^\[[^\]]*$/

function textOf(node: AstNode | undefined): string {
  if (!node) { return '' }
  return String(node.content ?? node.raw ?? '')
}

function paragraphText(node: AstNode): string {
  const raw = String(node.raw ?? '').trim()
  if (raw) { return raw }
  const children = Array.isArray(node.children) ? node.children as AstNode[] : []
  return children.map(textOf).join('').trim()
}

function isEmptyParagraph(node: AstNode): boolean {
  return node.type === 'paragraph' && !paragraphText(node)
}

function isIncompleteRefDefParagraph(node: AstNode): boolean {
  if (node.type !== 'paragraph') { return false }

  const raw = paragraphText(node)
  if (!raw) { return false }

  if (REF_DEF_RAW_RE.test(raw) || UNCLOSED_REF_LABEL_RE.test(raw)) { return true }

  const children = Array.isArray(node.children) ? node.children as AstNode[] : []
  if (children.length === 0) { return false }

  const first = children[0]
  if (first?.type === 'reference') {
    const second = children[1]
    // `[id]` 或 `[id]: ...` 流式残段
    return !second || textOf(second).startsWith(':')
  }

  if (first?.type === 'text') {
    const t = textOf(first).trimStart()
    if (REF_DEF_RAW_RE.test(t) || UNCLOSED_REF_LABEL_RE.test(t)) { return true }
  }

  return false
}

function walk(nodes: AstNode[]): AstNode[] {
  const out: AstNode[] = []
  for (const node of nodes) {
    if (isIncompleteRefDefParagraph(node)) { continue }

    if (Array.isArray(node.children)) {
      out.push({
        ...node,
        children: walk(node.children as AstNode[]),
      })
      continue
    }

    out.push(node)
  }

  // 引用定义流式间隙偶发空段落，去掉尾部避免闪空行
  while (out.length && isEmptyParagraph(out[out.length - 1]!)) { out.pop() }

  return out
}

export function stripIncompleteReferenceDefs<T extends AstNode>(nodes: T[]): T[] {
  return walk(nodes) as T[]
}
