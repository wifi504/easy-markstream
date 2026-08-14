<template>
  <div
    ref="rootRef"
    class="easy-markstream"
    :class="{ 'is-plain-text': plainText }"
  >
    <template v-if="plainText">
      <p
        ref="plainPRef"
        class="easy-markstream__plain-p"
      />
    </template>
    <markdown-render
      v-else
      custom-id="easy-markstream"
      mode="docs"
      :nodes="nodes"
      :final="final"
      :is-dark="false"
      :smooth-streaming="final ? false : 'auto'"
      :fade="false"
      :typewriter="false"
      :enable-mermaid="true"
      :enable-katex="true"
      :show-tooltips="false"
      :viewport-priority="false"
      :themes="codeThemes"
      :code-block-stream="true"
      :code-block-props="codeBlockProps"
      :code-block-monaco-options="codeBlockMonacoOptions"
      :mermaid-props="mermaidProps as any"
      v-bind="final ? {} : { maxLiveNodes: 0 }"
    />
    <span
      v-show="cursorEnabled"
      class="easy-markstream__typewriter-cursor"
      :class="{ 'is-docked': cursorDocked }"
      aria-hidden="true"
      :style="cursorStyle"
    />
    <markdown-sources
      v-if="!plainText && final && showSources && references.length > 0"
      :items="references"
    />
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import MarkdownRender, {
  enableKatex,
  enableMermaid,
  getMarkdown,
  parseMarkdownToStructure,
  setCustomComponents,
} from 'markstream-vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  toRef,
  watch,
} from 'vue'
import CodeBlock from './components/CodeBlock.vue'
import MarkdownCheckbox from './components/MarkdownCheckbox.vue'
import MarkdownImage from './components/MarkdownImage.vue'
import MarkdownLink from './components/MarkdownLink.vue'
import MarkdownSources from './components/MarkdownSources.vue'
import MermaidBlock from './components/MermaidBlock.vue'
import { scanAndBindCodeHScroll } from './utils/code-hscroll-util'
import { collectMarkdownReferences } from './utils/collect-markdown-references-util'
import {
  createDiffsBgObserver,
  scanAndPatchDiffsContainers,
} from './utils/diffs-shadow-patch'
import { FLOATING_UI_KEY, MARKSTREAM_FINAL_KEY } from './utils/floating-ui-context'
import { markParenWrappedLinks } from './utils/mark-paren-link-chip-util'
import { markdownNodesToPlainParagraphs } from './utils/markdown-to-plain-paragraphs-util'
import { stripIncompleteReferenceDefs } from './utils/strip-incomplete-ref-defs-util'
import { trimTaskListLeadingSpace } from './utils/trim-task-list-space-util'
import { measureTypewriterCursorBox, shouldDockTypewriterCursor } from './utils/typewriter-cursor-util'
import './styles/deps'

const props = withDefaults(defineProps<{
  content: string
  final?: boolean
  /** 预留；本版忽略 */
  dark?: boolean
  /** final 时是否展示文末「来源」；嵌套渲染应传 false */
  showSources?: boolean
  /**
   * 是否允许 Teleport 浮层（链接 tip、按钮 HoverPopover、图片灯箱等）。
   * 嵌套在浮层内渲染时请传 false，避免再叠一层浮层抢悬停。
   */
  floatingUi?: boolean
  /**
   * 打字机光标。走 `nodes` 预处理后 markstream 内置光标不会出现，由本组件复刻定位。
   * `final` 时强制关闭。默认开启。
   */
  typewriter?: boolean
  /**
   * 纯文本模式：全部挤进一个段落；单换行→两空格，连续换行→字面量 ` | `。
   * 强制不显示光标。默认关闭。
   */
  plainText?: boolean
}>(), {
  final: false,
  dark: false,
  showSources: true,
  floatingUi: true,
  typewriter: true,
  plainText: false,
})

provide(FLOATING_UI_KEY, toRef(props, 'floatingUi'))
provide(MARKSTREAM_FINAL_KEY, toRef(props, 'final'))

const cursorEnabled = computed(() => (
  !props.plainText && !props.final && props.typewriter
))

/** 启用 KaTeX / Mermaid，并注册本包自定义节点 */
enableMermaid()
enableKatex()
setCustomComponents('easy-markstream', {
  code_block: CodeBlock,
  mermaid: MermaidBlock,
  link: MarkdownLink,
  checkbox: MarkdownCheckbox,
  checkbox_input: MarkdownCheckbox,
  image: MarkdownImage,
})

const md = getMarkdown('easy-markstream')

const CODE_FONT_FAMILY = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const codeThemes: [string, string] = ['github-dark', 'github-light']
const codeBlockTheme = { dark: 'github-dark', light: 'github-light' }

const codeBlockMonacoOptions = {
  fontSize: 13,
  lineHeight: 18,
  fontFamily: CODE_FONT_FAMILY,
  tabSize: 2,
  wordWrap: 'off' as const,
  MAX_HEIGHT: 100_000,
  padding: { top: 8, bottom: 8 },
}

const mermaidProps = {
  themes: codeThemes,
  theme: codeBlockTheme,
  monacoOptions: codeBlockMonacoOptions,
}

const codeBlockProps = computed(() => ({
  theme: codeBlockTheme,
  showHeader: true,
  showCopyButton: true,
  showCollapseButton: false,
  showFontSizeButtons: false,
  enableFontSizeControl: false,
  showExpandButton: false,
  showPreviewButton: false,
  showTooltips: false,
}))

const parsed = computed(() => {
  const content = props.content || ''
  const references = props.plainText
    ? []
    : collectMarkdownReferences(md, content)
  const rawNodes = parseMarkdownToStructure(content, md, { final: props.final })
  const stripped = stripIncompleteReferenceDefs(rawNodes as Record<string, any>[])

  if (props.plainText) {
    return {
      nodes: stripped as typeof rawNodes,
      plainParagraphs: markdownNodesToPlainParagraphs(stripped),
      references,
    }
  }

  const nextNodes = markParenWrappedLinks(stripped)
  return {
    nodes: nextNodes as typeof rawNodes,
    plainParagraphs: [] as string[],
    references,
  }
})

const nodes = computed(() => parsed.value.nodes)
const plainParagraphs = computed(() => parsed.value.plainParagraphs)
/** 单段输出；真换行展示为字面量 ` | `（思考链展示） */
const plainTextContent = computed(() => plainParagraphs.value.join(' | '))
const references = computed(() => parsed.value.references)

const rootRef = ref<HTMLElement | null>(null)
const plainPRef = ref<HTMLElement | null>(null)
/** 已写入 plain DOM 的前缀；仅追加 delta，避免整段 textContent 重写 */
let persistedPlainText = ''
const cursorDocked = ref(false)
const cursorStyle = ref<CSSProperties>({ visibility: 'hidden' })
let diffsBgObserver: MutationObserver | undefined
let cursorFrame = 0

function syncPlainTextDom(next: string) {
  const el = plainPRef.value
  if (!el) { return }
  if (next === persistedPlainText) { return }
  if (next.startsWith(persistedPlainText)) {
    const delta = next.slice(persistedPlainText.length)
    if (delta) { el.append(document.createTextNode(delta)) }
    persistedPlainText = next
    return
  }
  el.textContent = next
  persistedPlainText = next
}

function refreshEnhancements(root: ParentNode = document) {
  if (props.plainText) { return }
  scanAndPatchDiffsContainers(root)
  scanAndBindCodeHScroll(root instanceof Document ? root : document)
  trimTaskListLeadingSpace(root)
}

function hideCursor() {
  cursorDocked.value = false
  cursorStyle.value = { visibility: 'hidden' }
}

async function repositionCursor() {
  if (!cursorEnabled.value) {
    hideCursor()
    return
  }
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  // 末尾是 code/mermaid 等块：改文档流钉在 MarkdownRender 后，避免绝对定位算飞
  if (shouldDockTypewriterCursor(nodes.value)) {
    cursorDocked.value = true
    cursorStyle.value = { visibility: 'visible' }
    return
  }

  const root = rootRef.value
  if (!root) {
    hideCursor()
    return
  }
  const scope = root.querySelector('.markstream-vue') || root
  const box = measureTypewriterCursorBox(root, scope)
  if (!box) {
    // 尚无正文时也钉底，保证看得见
    cursorDocked.value = true
    cursorStyle.value = { visibility: 'visible' }
    return
  }
  cursorDocked.value = false
  cursorStyle.value = {
    visibility: 'visible',
    left: `${box.left + 10}px`,
    top: `${box.top + Math.max(0, (box.height - 16) / 2)}px`,
  }
}

function scheduleRepositionCursor() {
  if (cursorFrame) { cancelAnimationFrame(cursorFrame) }
  cursorFrame = requestAnimationFrame(() => {
    cursorFrame = 0
    void repositionCursor()
  })
}

onMounted(() => {
  const root = rootRef.value
  if (!root) { return }
  if (!props.plainText) {
    diffsBgObserver = createDiffsBgObserver(root)
    refreshEnhancements(root)
  } else {
    syncPlainTextDom(plainTextContent.value)
  }
  scheduleRepositionCursor()
})

watch(
  () => `${props.content.length}:${props.final}:${nodes.value.length}:${String(props.typewriter)}:${props.plainText}:${plainParagraphs.value.length}`,
  async () => {
    await nextTick()
    if (rootRef.value) { refreshEnhancements(rootRef.value) }
    scheduleRepositionCursor()
  },
  { flush: 'post' },
)

watch(
  [plainTextContent, () => props.plainText],
  async ([next, isPlain]) => {
    if (!isPlain) {
      persistedPlainText = ''
      return
    }
    await nextTick()
    syncPlainTextDom(String(next || ''))
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  diffsBgObserver?.disconnect()
  diffsBgObserver = undefined
  if (cursorFrame) { cancelAnimationFrame(cursorFrame) }
})
</script>

<style>
@import './styles/github-light.css';

.easy-markstream {
  position: relative;
}

.easy-markstream.is-plain-text {
  color: #1f2328;
  font-size: 16px;
  font-family: var(--ms-font-sans);
  line-height: 26px;
  overflow-wrap: break-word;
}

/* 真换行用 <br>；压过主题 p 的底边距 */
.easy-markstream.is-plain-text .easy-markstream__plain-p {
  margin: 0 !important;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  line-height: inherit;
  white-space: pre-wrap;
}

/* 打字机光标：ChatGPT 风格，主字色实心圆呼吸缩放 */
.easy-markstream__typewriter-cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 16px;
  height: 16px;
  background-color: #1f2328;
  border-radius: 50%;
  transform-origin: center center;
  animation: ems-cursor-breathe 1.05s ease-in-out infinite;
  pointer-events: none;
}

/* 块级流式 / plain-text：退出 absolute，跟在文档流末尾 */
.easy-markstream__typewriter-cursor.is-docked {
  position: static;
  display: block;
  margin-top: 10px;
}

@keyframes ems-cursor-breathe {
  0%,
  100% {
    transform: scale(0.72);
    opacity: 0.72;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
