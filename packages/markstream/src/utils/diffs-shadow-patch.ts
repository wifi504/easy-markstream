/** stream-diffs Shadow DOM：背景 / padding / 行号几何与流式 Pre 对齐 */

const CODE_BLOCK_BG = '#f6f8fa'
const CODE_PAD_Y = 8
const CODE_PAD_LEFT = 44
const CODE_PAD_RIGHT = 12
const CODE_FONT_FAMILY = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const DIFFS_STYLE_PATCH_ID = 'easy-markstream-diffs-style-patch'

const HOST_VARS_SET = new WeakSet<HTMLElement>()

export function patchDiffsContainerBg(host: HTMLElement) {
  if (!HOST_VARS_SET.has(host)) {
    HOST_VARS_SET.add(host)
    host.style.setProperty('--diffs-light-bg', CODE_BLOCK_BG, 'important')
    host.style.setProperty('--diffs-dark-bg', CODE_BLOCK_BG, 'important')
    host.style.setProperty('--diffs-gap-block', `${CODE_PAD_Y}px`, 'important')
    host.style.setProperty('--diffs-gap-fallback', `${CODE_PAD_Y}px`, 'important')
    host.style.setProperty('--diffs-font-family', CODE_FONT_FAMILY, 'important')
    host.style.setProperty('--diffs-min-number-column-width', '2ch', 'important')
    host.style.setProperty('--diffs-min-number-column-width-default', '2ch', 'important')
    host.style.setProperty('background', CODE_BLOCK_BG, 'important')
    host.style.setProperty('background-color', CODE_BLOCK_BG, 'important')
    host.style.setProperty('border-radius', '4px', 'important')
    host.style.setProperty('margin', '0', 'important')
  }

  const root = host.shadowRoot
  if (!root || root.getElementById(DIFFS_STYLE_PATCH_ID)) { return }

  const style = document.createElement('style')
  style.id = DIFFS_STYLE_PATCH_ID
  style.textContent = `
    :host {
      --diffs-light-bg: ${CODE_BLOCK_BG} !important;
      --diffs-dark-bg: ${CODE_BLOCK_BG} !important;
      --diffs-gap-block: ${CODE_PAD_Y}px !important;
      --diffs-gap-fallback: ${CODE_PAD_Y}px !important;
      --diffs-font-family: ${CODE_FONT_FAMILY} !important;
      --diffs-font-fallback: ${CODE_FONT_FAMILY} !important;
      --diffs-min-number-column-width: 2ch !important;
      --diffs-min-number-column-width-default: 2ch !important;
      --diffs-scrollbar-gutter: 0px !important;
      --diffs-scrollbar-gutter-measured: 0px !important;
      --diffs-scrollbar-gutter-fallback: 0px !important;
      --diffs-scrollbar-gutter-override: 0px !important;
      margin: 0 !important;
      background: ${CODE_BLOCK_BG} !important;
      background-color: ${CODE_BLOCK_BG} !important;
      font-family: ${CODE_FONT_FAMILY} !important;
    }

    :host,
    pre,
    code,
    [data-file],
    [data-diff] {
      --diffs-light-bg: ${CODE_BLOCK_BG} !important;
      --diffs-dark-bg: ${CODE_BLOCK_BG} !important;
      margin: 0 !important;
      background: ${CODE_BLOCK_BG} !important;
      background-color: ${CODE_BLOCK_BG} !important;
      font-family: ${CODE_FONT_FAMILY} !important;
      font-size: 13px !important;
      line-height: 18px !important;
    }

    pre[data-file],
    pre[data-diff] {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: ${CODE_PAD_Y}px ${CODE_PAD_RIGHT}px ${CODE_PAD_Y}px 0 !important;
      overflow: hidden !important;
      white-space: pre !important;
    }

    code,
    [data-code] {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      grid-template-columns: ${CODE_PAD_LEFT}px max-content !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      scrollbar-width: none !important;
    }

    code::-webkit-scrollbar,
    [data-code]::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
    }

    [data-gutter] {
      position: sticky !important;
      left: 0 !important;
      z-index: 1;
      box-sizing: border-box !important;
      width: ${CODE_PAD_LEFT}px !important;
      max-width: ${CODE_PAD_LEFT}px !important;
      background: ${CODE_BLOCK_BG} !important;
    }

    [data-gutter] [data-column-number] {
      box-sizing: content-box !important;
      display: flex !important;
      justify-content: flex-end !important;
      align-items: center !important;
      width: 2ch !important;
      min-width: 2ch !important;
      max-width: 2ch !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      padding-left: 2ch !important;
      padding-right: 1ch !important;
    }

    [data-gutter] [data-column-number]::before {
      content: none !important;
      display: none !important;
      min-width: 0 !important;
      width: 0 !important;
    }

    [data-gutter] [data-line-number-content] {
      box-sizing: content-box !important;
      display: block !important;
      width: 100% !important;
      text-align: right !important;
      font-variant-numeric: tabular-nums;
    }

    [data-content] {
      min-width: max-content !important;
    }

    [data-content] [data-line],
    [data-content] [data-line-type] {
      padding-left: 0 !important;
      padding-right: 0 !important;
      white-space: pre !important;
    }

    ::selection {
      color: inherit;
      background: rgba(9, 105, 218, 0.18);
    }

    ::-moz-selection {
      color: inherit;
      background: rgba(9, 105, 218, 0.18);
    }
  `
  root.appendChild(style)
}

export function scanAndPatchDiffsContainers(root: ParentNode = document) {
  root.querySelectorAll('diffs-container').forEach((node) => {
    patchDiffsContainerBg(node as HTMLElement)
  })
}

export function createDiffsBgObserver(
  root: HTMLElement,
  onPatched?: () => void,
): MutationObserver {
  scanAndPatchDiffsContainers(root)
  onPatched?.()

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) { return }
        if (node.tagName === 'DIFFS-CONTAINER') { patchDiffsContainerBg(node) } else { scanAndPatchDiffsContainers(node) }
      })
    }
    onPatched?.()
  })
  observer.observe(root, { childList: true, subtree: true })
  return observer
}
