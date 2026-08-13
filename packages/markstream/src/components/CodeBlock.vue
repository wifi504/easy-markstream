<template>
  <div ref="rootRef" class="ms-code-block" :class="{ 'is-streaming': blockLoading }">
    <!--
      未闭合：增量 Pre（保选区）。
      闭合后的 CodeBlockNode 在流式期也保持挂载（v-show），
      避免晚挂载一直卡在 viewport-pending、Monaco 不启动。
    -->
    <div
      v-show="blockLoading"
      class="code-block-container rounded-lg border is-rendering"
      data-markstream-code-block="1"
      data-markstream-code-block-state="streaming"
      data-markstream-enhanced="false"
      data-markstream-enhancement-state="pending"
    >
      <div
        v-if="showHeader"
        class="code-block-header flex justify-between items-center"
      >
        <div class="ms-code__left">
          <code-bracket-icon class="ms-code__lang-icon" :size="15" />
          <span class="ms-code__lang">{{ languageLabel }}</span>
        </div>
        <span
          class="ms-code__copy-btn is-placeholder"
          aria-hidden="true"
        />
      </div>
      <div class="code-block-shell-content">
        <incremental-code-pre
          :code="streamCode"
          :language="languageRaw"
        />
      </div>
    </div>

    <code-block-node
      v-show="!blockLoading"
      :node="(renderNode as any)"
      :loading="blockLoading"
      :stream="stream"
      :is-dark="isDark"
      :themes="themes"
      :theme="theme"
      :monaco-options="monacoOptions"
      :show-header="showHeader"
      :show-copy-button="false"
      :show-collapse-button="false"
      :show-font-size-buttons="false"
      :enable-font-size-control="false"
      :show-expand-button="false"
      :show-preview-button="false"
      :show-tooltips="false"
      :custom-id="customId"
      :index-key="indexKey"
    >
      <template v-if="showHeader" #header-left>
        <div class="ms-code__left">
          <code-bracket-icon class="ms-code__lang-icon" :size="15" />
          <span class="ms-code__lang">{{ languageLabel }}</span>
        </div>
      </template>
      <template v-if="showHeader" #header-right>
        <hover-popover
          v-if="canCopy"
          :content="copied ? '已复制' : '复制'"
        >
          <button
            type="button"
            class="ms-code__copy-btn"
            :aria-label="copied ? '已复制' : '复制'"
            @click="copyCode"
          >
            <svg v-if="copied" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 4.5L6.5 11.5 2.5 7.5" />
            </svg>
            <svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
              <path fill="currentColor" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
            </svg>
          </button>
        </hover-popover>
        <span
          v-else
          class="ms-code__copy-btn is-placeholder"
          aria-hidden="true"
        />
      </template>
    </code-block-node>
  </div>
</template>

<script setup lang="ts">
import type { CodeBlockMonacoOptions, CodeBlockThemeProp } from 'markstream-vue'
import { CodeBlockNode } from 'markstream-vue'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { findStreamPaper, hasRenderedContentAfter } from '../utils/code-fence-util'
import { bindCodeBlockHScroll } from '../utils/code-hscroll-util'
import CodeBracketIcon from './CodeBracketIcon.vue'
import HoverPopover from './HoverPopover.vue'
import IncrementalCodePre from './IncrementalCodePre.vue'

const props = withDefaults(defineProps<{
  node: Record<string, any>
  loading?: boolean
  stream?: boolean
  isDark?: boolean
  themes?: [string, string] | string[]
  theme?: CodeBlockThemeProp
  monacoOptions?: CodeBlockMonacoOptions
  showHeader?: boolean
  showCopyButton?: boolean
  customId?: string
  indexKey?: string | number
}>(), {
  loading: true,
  stream: true,
  isDark: false,
  showHeader: true,
  showCopyButton: true,
})

const rootRef = ref<HTMLElement | null>(null)
/** 后续节点已渲染 ⇒ fence 实际已闭合（修复引用块内 loading 粘住） */
const followedByContent = ref(false)

let paperObserver: MutationObserver | null = null

function refreshFollowedByContent() {
  followedByContent.value = hasRenderedContentAfter(rootRef.value)
}

/**
 * node.loading 为真且后方尚无内容 → 仍在流式；
 * 引用块内常见：fence 已闭合、后续标题已出，但 loading 仍 true。
 */
const blockLoading = computed(() => {
  const nodeLoading = typeof props.node?.loading === 'boolean'
    ? props.node.loading
    : !!props.loading
  if (!nodeLoading) { return false }
  if (followedByContent.value) { return false }
  return true
})

/** 单块闭合后即可复制，不跟整篇 renderFinal 绑死 */
const canCopy = computed(() => props.showCopyButton && !blockLoading.value)

/**
 * 闭合后冻结 node，避免后续整篇流式重解析把 CodeBlockNode / diffs 整棵重绘
 * （否则虚拟条绑的是已卸节点，split 横滑会被瞬间掰回开头）。
 */
const closedNode = ref<Record<string, any> | null>(null)

function snapshotClosedNode() {
  const node = props.node
  if (!node) { return }
  closedNode.value = { ...node, loading: false }
}

const renderNode = computed(() => {
  if (!blockLoading.value) {
    return closedNode.value ?? (props.node ? { ...props.node, loading: false } : props.node)
  }
  return props.node
})

watch(
  () => [props.node?.loading, props.node?.code, props.node?.raw, props.indexKey],
  () => {
    nextTick(refreshFollowedByContent)
  },
)

function scheduleClosedHScroll() {
  const el = rootRef.value
  if (el) { bindCodeBlockHScroll(el) }
}

watch(blockLoading, (loading) => {
  if (loading) {
    closedNode.value = null
    return
  }
  snapshotClosedNode()
  nextTick(scheduleClosedHScroll)
}, { flush: 'post' })

onMounted(() => {
  refreshFollowedByContent()
  if (!blockLoading.value) {
    snapshotClosedNode()
    nextTick(scheduleClosedHScroll)
  }
  const paper = findStreamPaper(rootRef.value)
  if (paper && typeof MutationObserver !== 'undefined') {
    paperObserver = new MutationObserver(() => {
      refreshFollowedByContent()
    })
    paperObserver.observe(paper, { childList: true, subtree: true, characterData: true })
  }
})

const LANG_LABELS: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  go: 'Go',
  golang: 'Go',
  sh: 'Shell',
  bash: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  md: 'Markdown',
  markdown: 'Markdown',
  plaintext: 'Plain Text',
  text: 'Plain Text',
  txt: 'Plain Text',
  diff: 'Differences',
  patch: 'Differences',
  udiff: 'Differences',
}

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const languageRaw = computed(() => String(props.node?.language ?? '').trim())

function looksLikeDiff(code: string) {
  const lines = code.split('\n').filter(line => line.length > 0)
  if (!lines.length) { return false }
  if (/^(diff --git |--- |\+\+\+ |@@ )/.test(lines[0])) { return true }
  return lines.some(line => line.startsWith('+')) && lines.some(line => line.startsWith('-'))
}

const languageLabel = computed(() => {
  if (props.node?.diff) { return LANG_LABELS.diff }
  const raw = languageRaw.value.toLowerCase()
  if (!raw || raw === 'plaintext' || raw === 'text' || raw === 'txt') {
    if (looksLikeDiff(String(props.node?.raw ?? props.node?.code ?? ''))) { return LANG_LABELS.diff }
    return LANG_LABELS.plaintext
  }
  if (LANG_LABELS[raw]) { return LANG_LABELS[raw] }
  return raw.charAt(0).toUpperCase() + raw.slice(1)
})

/** 流式阶段优先用 node.code（与 PreCode 一致，loading 时保留尾部换行） */
const streamCode = computed(() => String(props.node?.code ?? ''))

const sourceCode = computed(() => String(props.node?.code ?? props.node?.raw ?? ''))

function markCopied() {
  copied.value = true
  if (copiedTimer) { clearTimeout(copiedTimer) }
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = null
  }, 1000)
}

async function copyCode() {
  const text = sourceCode.value
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text) } else { throw new Error('clipboard unavailable') }
    markCopied()
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
      markCopied()
    } catch {
      // ignore
    }
  }
}

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
  paperObserver?.disconnect()
  paperObserver = null
})
</script>

<style scoped>
.ms-code-block {
  min-width: 0;
  max-width: 100%;
}

.ms-code__left {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;

  /* 与代码区正文起点对齐（行号槽 CODE_PAD_LEFT = 44px） */
  padding-left: 44px;
  color: #59636e;
}

.ms-code__lang-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  flex-shrink: 0;
  color: #59636e;
  transform: translateY(-50%);
}

.ms-code__lang {
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ms-code__copy-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #59636e;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}

.ms-code__copy-btn:hover:not(.is-placeholder) {
  background: #f0f2f4;
}

.ms-code__copy-btn.is-placeholder {
  visibility: hidden;
  cursor: default;
  pointer-events: none;
}
</style>
