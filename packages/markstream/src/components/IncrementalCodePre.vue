<template>
  <!-- 注意：<pre> 子节点之间不能有空白，否则会变成匿名文本节点，造成空行/行号错位 -->
  <pre
    class="markstream-pre--line-numbers code-pre-fallback"
    :class="languageClass"
    :aria-label="ariaLabel"
    :data-language="languageId"
    data-markstream-pre="1"
    data-markstream-line-numbers="1"
    aria-busy="true"
    tabindex="0"
    :style="preStyle"
  ><span
    ref="lineNumbersRef"
    class="markstream-pre__line-numbers"
    aria-hidden="true"
  ><span class="markstream-pre__line-numbers-text" /></span><code
    ref="codeRef"
    translate="no"
    class="markstream-pre__code"
  /></pre>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  code: string
  language?: string
}>(), {
  language: 'plaintext',
})

const codeRef = ref<HTMLElement | null>(null)
const lineNumbersRef = ref<HTMLElement | null>(null)
const lineCount = ref(1)

/** 已写入 DOM 的代码前缀；仅追加 delta，避免整段 textContent 重写清掉选区 */
let persistedCode = ''

const languageId = computed(() => {
  const raw = String(props.language ?? '').trim().toLowerCase()
  const token = raw.split(/\s+/g)[0] ?? ''
  return token.replace(/[^\w-]/g, '') || 'plaintext'
})

const languageClass = computed(() => `language-${languageId.value}`)

const ariaLabel = computed(() => `Code block: ${languageId.value}`)

/** 固定 gutter 几何，避免位数变化时改 CSS 变量引发换行帧跳动 */
const preStyle = {
  '--markstream-pre-line-number-width': '2ch',
} as Record<string, string>

function countLines(text: string): number {
  if (!text) { return 1 }
  let lines = 1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\n') {
      lines++
    } else if (ch === '\r') {
      lines++
      if (text[i + 1] === '\n') { i++ }
    }
  }
  return lines
}

function lineNumbersTextEl(): HTMLElement | null {
  return lineNumbersRef.value?.querySelector('.markstream-pre__line-numbers-text')
    ?? lineNumbersRef.value
}

/**
 * 行号与代码同步：先保证 code 已写入换行，再追加行号，
 * 避免 absolute 行号比 pre 更高而漏出块外。
 */
function syncLineNumbers(nextCode: string) {
  const el = lineNumbersTextEl()
  if (!el) { return }

  const nextCount = countLines(nextCode)
  if (nextCount === lineCount.value && el.firstChild) { return }

  if (nextCount < lineCount.value || !el.firstChild) {
    let text = '1'
    for (let n = 2; n <= nextCount; n++) { text += `\n${n}` }
    el.textContent = text
    lineCount.value = nextCount
    return
  }

  if (nextCount > lineCount.value) {
    let delta = ''
    for (let n = lineCount.value + 1; n <= nextCount; n++) { delta += `\n${n}` }
    el.appendChild(document.createTextNode(delta))
    lineCount.value = nextCount
  }
}

function applyCode(next: string) {
  const el = codeRef.value
  if (!el) { return }

  if (next.startsWith(persistedCode)) {
    if (!persistedCode && next) {
      el.textContent = next
      persistedCode = next
    } else if (next.length > persistedCode.length) {
      el.appendChild(document.createTextNode(next.slice(persistedCode.length)))
      persistedCode = next
    }
  } else {
    el.textContent = next
    persistedCode = next
  }

  // 强制读一下布局，让 pre 高度先随 code 换行更新，再长行号
  void el.offsetHeight
  syncLineNumbers(next)
}

watch(
  () => props.code,
  async (next) => {
    const text = String(next ?? '')
    if (!codeRef.value) { await nextTick() }
    applyCode(text)
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => {
  persistedCode = ''
  lineCount.value = 1
})
</script>
