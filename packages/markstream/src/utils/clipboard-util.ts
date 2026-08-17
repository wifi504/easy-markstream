/** 复制纯文本到剪贴板；异步 Clipboard API 失败时回退 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    throw new Error('clipboard unavailable')
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

export interface RasterizeSvgSize {
  cssWidth: number
  cssHeight: number
  pixelRatio?: number
}

function exportPixelRatio(override?: number): number {
  if (override && override > 0) { return override }
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return Math.max(2, dpr)
}

function normalizeSvgMarkup(svg: string): string {
  let out = svg.trim().replace(/^<\?xml[^>]*>\s*/i, '')
  if (!/^<svg[\s>]/i.test(out)) { return out }
  if (!/\sxmlns=/.test(out)) {
    out = out.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
  }
  if (/xlink:/i.test(out) && !/xmlns:xlink=/.test(out)) {
    out = out.replace(/^<svg/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
  }
  return out
}

/** 写入解码用的像素宽高；没有 viewBox 时用用户坐标补上，避免图只占左上角、右侧大块留白 */
function injectSvgPixelSize(svg: string, pxW: number, pxH: number, viewW: number, viewH: number): string {
  return svg.replace(/^<svg\b([^>]*)>/i, (_m, rawAttrs: string) => {
    let attrs = String(rawAttrs)
    attrs = attrs.replace(/\s(?:width|height)=("[^"]*"|'[^']*')/gi, '')
    attrs = attrs.replace(/\sstyle=("[^"]*"|'[^']*')/gi, '')
    if (!/\sviewBox=/i.test(attrs)) {
      attrs += ` viewBox="0 0 ${viewW} ${viewH}"`
    }
    return `<svg${attrs} width="${pxW}" height="${pxH}" style="width:${pxW}px;height:${pxH}px">`
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('svg image load failed'))
    img.src = src
  })
}

async function svgMarkupToPngBlobAtPixels(
  svgMarkup: string,
  pxW: number,
  pxH: number,
  viewW: number,
  viewH: number,
): Promise<Blob> {
  const svg = injectSvgPixelSize(normalizeSvgMarkup(svgMarkup), pxW, pxH, viewW, viewH)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = pxW
    canvas.height = pxH
    const ctx = canvas.getContext('2d')
    if (!ctx) { throw new Error('canvas unavailable') }
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, pxW, pxH)
    ctx.drawImage(img, 0, 0, pxW, pxH)
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!png) { throw new Error('png encode failed') }
    return png
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function copyPngBlob(blob: Blob): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      return false
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
    return true
  } catch {
    return false
  }
}

export async function copySvgMarkupAsPng(svgMarkup: string, size: RasterizeSvgSize): Promise<boolean> {
  if (!svgMarkup.trim()) { return false }
  const cssW = Math.max(1, size.cssWidth)
  const cssH = Math.max(1, size.cssHeight)
  const ratio = exportPixelRatio(size.pixelRatio)
  const pxW = Math.max(1, Math.round(cssW * ratio))
  const pxH = Math.max(1, Math.round(cssH * ratio))
  try {
    const png = await svgMarkupToPngBlobAtPixels(svgMarkup, pxW, pxH, cssW, cssH)
    return await copyPngBlob(png)
  } catch {
    return false
  }
}

/** clone 后再写尺寸，不改页面上正在预览的 SVG */
export async function copySvgElementAsPng(svg: SVGSVGElement, size: RasterizeSvgSize): Promise<boolean> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('style')
  const markup = new XMLSerializer().serializeToString(clone)
  return copySvgMarkupAsPng(markup, size)
}
