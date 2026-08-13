/**
 * 任务列表解析后，`]` 后的空格会留在后续 text 节点里（如 " 需求分析"）。
 * 普通 ul 的 `- ` 分隔空格不会进正文。渲染后去掉 checkbox 后首个文本的前导空白。
 */
export function trimTaskListLeadingSpace(root: ParentNode = document) {
  const checkboxes = root.querySelectorAll('.checkbox-node')
  for (const cb of checkboxes) {
    let el = cb.nextElementSibling
    while (el) {
      if (el.classList.contains('text-node')) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        const text = walker.nextNode()
        if (text?.nodeValue && /^\s+/.test(text.nodeValue)) { text.nodeValue = text.nodeValue.replace(/^\s+/, '') }
        break
      }
      el = el.nextElementSibling
    }
  }
}
