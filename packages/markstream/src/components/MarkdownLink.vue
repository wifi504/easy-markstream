<template>
  <span
    v-if="node.loading"
    class="link-loading ms-md-link is-loading"
    aria-hidden="true"
  >
    <span class="ms-md-link__label">{{ node.text || '' }}</span>
  </span>
  <span
    v-else
    ref="wrapEl"
    class="ms-md-link-wrap"
    :class="{ 'is-chip': isChip }"
    @mouseenter="openTip"
    @mouseleave="scheduleCloseTip"
    @focusin="openTip"
    @focusout="onFocusOut"
  >
    <component
      :is="href ? 'a' : 'span'"
      class="link-node ms-md-link"
      :class="{
        'is-chip': isChip,
        'is-chip-pending': isChipPending,
        'is-chip-unknown': isChipUnknown,
      }"
      :href="href || undefined"
      :target="href ? target : undefined"
      :rel="href ? rel : undefined"
      :title="nativeTitle"
      :aria-label="ariaLabel"
      :role="href ? undefined : 'text'"
    >
      <template v-if="isChipPending">
        <span class="ms-md-link__chip-spinner" aria-hidden="true" />
      </template>
      <template v-else-if="isChipUnknown">
        <svg
          class="ms-md-link__chip-favicon ms-md-link__chip-favicon--fallback"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m-.5 1.56A6.5 6.5 0 0 0 1.56 7.5h2.1c.1-1.4.4-2.7.85-3.82A12 12 0 0 1 7.5 1.56m1 0c1.05.4 1.95 1.5 2.5 2.12.45 1.12.75 2.42.85 3.82h2.1A6.5 6.5 0 0 0 8.5 1.56M1.56 8.5A6.5 6.5 0 0 0 7.5 14.44c-.9-.8-1.6-2.1-2-3.72-.3-1.15-.5-2.4-.59-3.72h-3.35Zm5.04 0c.1 1.45.32 2.8.66 3.9.35 1.1.8 1.9 1.24 2.28.44-.38.89-1.18 1.24-2.28.34-1.1.56-2.45.66-3.9H6.6Zm5.15 0c-.09 1.32-.29 2.57-.59 3.72-.4 1.62-1.1 2.92-2 3.72A6.5 6.5 0 0 0 14.44 8.5h-2.69Z" />
        </svg>
        <span class="ms-md-link__chip-label">unknown</span>
      </template>
      <template v-else-if="isChip">
        <img
          v-if="chipFaviconUrl"
          :key="chipFaviconUrl"
          class="ms-md-link__chip-favicon"
          :src="chipFaviconUrl"
          alt=""
          width="14"
          height="14"
          decoding="async"
          @error="onChipFaviconError"
        >
        <svg
          v-else
          class="ms-md-link__chip-favicon ms-md-link__chip-favicon--fallback"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m-.5 1.56A6.5 6.5 0 0 0 1.56 7.5h2.1c.1-1.4.4-2.7.85-3.82A12 12 0 0 1 7.5 1.56m1 0c1.05.4 1.95 1.5 2.5 2.12.45 1.12.75 2.42.85 3.82h2.1A6.5 6.5 0 0 0 8.5 1.56M1.56 8.5A6.5 6.5 0 0 0 7.5 14.44c-.9-.8-1.6-2.1-2-3.72-.3-1.15-.5-2.4-.59-3.72h-3.35Zm5.04 0c.1 1.45.32 2.8.66 3.9.35 1.1.8 1.9 1.24 2.28.44-.38.89-1.18 1.24-2.28.34-1.1.56-2.45.66-3.9H6.6Zm5.15 0c-.09 1.32-.29 2.57-.59 3.72-.4 1.62-1.1 2.92-2 3.72A6.5 6.5 0 0 0 14.44 8.5h-2.69Z" />
        </svg>
        <span class="ms-md-link__chip-label">{{ chipLabel }}</span>
      </template>
      <template v-else>
        <span class="ms-md-link__label">
          <component
            :is="resolveChild(child)"
            v-for="(child, i) in children"
            :key="`${indexKey || 'link'}-${i}`"
            :node="child"
            :custom-id="customId"
            :index-key="`${indexKey || 'link'}-${i}`"
          />
        </span>
        <share-icon class="ms-md-link__icon" />
      </template>
    </component>

    <teleport to="body">
      <span
        v-show="tipVisible && href"
        ref="bubbleEl"
        class="ms-md-link__bubble"
        :class="placement === 'bottom' ? 'is-bottom' : 'is-top'"
        role="tooltip"
        :style="bubbleStyle"
        @mouseenter="cancelCloseTip"
        @mouseleave="scheduleCloseTip"
      >
        <img
          v-if="faviconUrl"
          :key="faviconUrl"
          class="ms-md-link__favicon"
          :src="faviconUrl"
          alt=""
          width="14"
          height="14"
          decoding="async"
          @load="repositionBubble"
          @error="onFaviconError"
        >
        <svg
          v-else
          class="ms-md-link__favicon ms-md-link__favicon--fallback"
          viewBox="0 0 16 16"
          width="14"
          height="14"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m-.5 1.56A6.5 6.5 0 0 0 1.56 7.5h2.1c.1-1.4.4-2.7.85-3.82A12 12 0 0 1 7.5 1.56m1 0c1.05.4 1.95 1.5 2.5 2.12.45 1.12.75 2.42.85 3.82h2.1A6.5 6.5 0 0 0 8.5 1.56M1.56 8.5A6.5 6.5 0 0 0 7.5 14.44c-.9-.8-1.6-2.1-2-3.72-.3-1.15-.5-2.4-.59-3.72h-3.35Zm5.04 0c.1 1.45.32 2.8.66 3.9.35 1.1.8 1.9 1.24 2.28.44-.38.89-1.18 1.24-2.28.34-1.1.56-2.45.66-3.9H6.6Zm5.15 0c-.09 1.32-.29 2.57-.59 3.72-.4 1.62-1.1 2.92-2 3.72A6.5 6.5 0 0 0 14.44 8.5h-2.69Z" />
        </svg>
        <span class="ms-md-link__url" :title="displayHref">{{ displayHref }}</span>
        <hover-popover :content="copied ? '已复制' : '复制'">
          <button
            type="button"
            class="ms-md-link__copy"
            :aria-label="copied ? '已复制' : '复制链接'"
            @click.stop.prevent="copyHref"
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
      </span>
    </teleport>
  </span>
</template>

<script setup lang="ts">
import type { Component, CSSProperties } from 'vue'
import type { PopoverPlacement } from '../utils/popover-boundary-util'
import {
  EmphasisNode,
  getCustomNodeComponents,
  HtmlInlineNode,
  ImageNode,
  InlineCodeNode,
  shouldOpenLinkInNewTab,
  StrikethroughNode,
  StrongNode,
  TextNode,
} from 'markstream-vue'
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { FLOATING_UI_KEY, MARKSTREAM_FINAL_KEY } from '../utils/floating-ui-context'
import { faviconCandidatesForHref, resolveLinkLabel } from '../utils/link-label-util'
import {
  computeFixedPopoverPosition,
  findPopoverBoundary,

} from '../utils/popover-boundary-util'
import HoverPopover from './HoverPopover.vue'
import ShareIcon from './ShareIcon.vue'

const props = withDefaults(defineProps<{
  node: Record<string, any>
  indexKey?: string | number
  customId?: string
  showTooltip?: boolean
}>(), {
  showTooltip: true,
})

const floatingUi = inject(FLOATING_UI_KEY, ref(true))
const isFinal = inject(MARKSTREAM_FINAL_KEY, ref(false))
const tipEnabled = computed(() => props.showTooltip !== false && floatingUi.value !== false)

const URL_MAX = 40

const BASE_CHILDREN: Record<string, Component> = {
  text: TextNode,
  strong: StrongNode,
  strikethrough: StrikethroughNode,
  emphasis: EmphasisNode,
  image: ImageNode,
  html_inline: HtmlInlineNode,
  inline_code: InlineCodeNode,
}

const wrapEl = ref<HTMLElement | null>(null)
const bubbleEl = ref<HTMLElement | null>(null)
const tipVisible = ref(false)
const placement = ref<PopoverPlacement>('top')
const coords = ref({ left: 0, top: 0, arrowOffsetX: 0 })
const copied = ref(false)
/** tip / chip 共用 favicon 候选下标；越界则用内置地球图标 */
const faviconIndex = ref(0)
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let closeTipTimer: ReturnType<typeof setTimeout> | null = null

const bubbleStyle = computed((): CSSProperties => ({
  'left': `${coords.value.left}px`,
  'top': `${coords.value.top}px`,
  '--arrow-x': `${coords.value.arrowOffsetX}px`,
}))

const isChip = computed(() => !!props.node?.chip)

const children = computed(() => {
  const list = props.node?.children
  return Array.isArray(list) && list.length > 0
    ? list
    : [{ type: 'text', content: String(props.node?.text ?? ''), raw: String(props.node?.text ?? '') }]
})

const childComponents = computed(() => ({
  ...BASE_CHILDREN,
  ...getCustomNodeComponents(props.customId),
}))

const href = computed(() => String(props.node?.href ?? ''))

/** 括号 chip 但引用定义尚未到达 */
const isChipUnresolved = computed(() => isChip.value && !href.value)
const isChipPending = computed(() => isChipUnresolved.value && !isFinal.value)
const isChipUnknown = computed(() => isChipUnresolved.value && !!isFinal.value)

const chipLabel = computed(() => resolveLinkLabel({
  text: props.node?.text,
  title: props.node?.title,
  href: href.value,
}))

const displayHref = computed(() => {
  let url = href.value
  try {
    url = decodeURIComponent(url)
  } catch {
    // keep raw
  }
  if (url.length <= URL_MAX) { return url }
  return `${url.slice(0, URL_MAX)}...`
})

const faviconCandidates = computed(() => faviconCandidatesForHref(href.value))

/** 悬浮气泡 / chip 左侧站点图标；候选耗尽则模板走 fallback SVG */
const faviconUrl = computed(() => faviconCandidates.value[faviconIndex.value] || '')
const chipFaviconUrl = faviconUrl

watch(href, () => {
  faviconIndex.value = 0
})

function onFaviconError() {
  if (faviconIndex.value < faviconCandidates.value.length - 1) { faviconIndex.value += 1 } else { faviconIndex.value = faviconCandidates.value.length }
  void repositionBubble()
}

function onChipFaviconError() {
  onFaviconError()
}

const target = computed(() => {
  const fromAttrs = readAttr('target')
  if (fromAttrs) { return fromAttrs }
  return href.value && shouldOpenLinkInNewTab(href.value) ? '_blank' : undefined
})

const isBlank = computed(() => String(target.value || '').toLowerCase() === '_blank')

const rel = computed(() => {
  const fromAttrs = readAttr('rel')
  const parts = new Set(
    (fromAttrs || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter(t => t.toLowerCase() !== 'opener'),
  )
  if (isBlank.value) {
    parts.add('noopener')
    parts.add('noreferrer')
  }
  return parts.size ? Array.from(parts).join(' ') : undefined
})

/** 不用原生 title，避免与自定义气泡叠两层 */
const nativeTitle = computed(() => undefined)

const ariaLabel = computed(() => {
  if (isChipPending.value) { return 'Link: loading' }
  if (isChipUnknown.value) { return 'Link: unknown' }
  const label = isChip.value
    ? chipLabel.value
    : String(props.node?.text || href.value || 'link')
  return `Link: ${label}`
})

async function repositionBubble() {
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const wrap = wrapEl.value
  const bubble = bubbleEl.value
  if (!wrap || !bubble || !tipVisible.value) { return }

  const pos = computeFixedPopoverPosition({
    triggerRect: wrap.getBoundingClientRect(),
    tipWidth: bubble.offsetWidth,
    tipHeight: bubble.offsetHeight,
    boundary: findPopoverBoundary(wrap),
    preferred: 'top',
    triggerEl: wrap,
  })
  placement.value = pos.placement
  coords.value = {
    left: pos.left,
    top: pos.top,
    arrowOffsetX: pos.arrowOffsetX,
  }
}

function cancelCloseTip() {
  if (closeTipTimer) {
    clearTimeout(closeTipTimer)
    closeTipTimer = null
  }
}

function scheduleCloseTip() {
  cancelCloseTip()
  closeTipTimer = setTimeout(() => {
    tipVisible.value = false
    placement.value = 'top'
    closeTipTimer = null
  }, 120)
}

function openTip() {
  if (!tipEnabled.value || !href.value) { return }
  cancelCloseTip()
  tipVisible.value = true
  void repositionBubble()
}

function onFocusOut(e: FocusEvent) {
  const root = e.currentTarget
  const next = e.relatedTarget
  if (root instanceof HTMLElement && next instanceof Node && root.contains(next)) { return }
  if (next instanceof Node && bubbleEl.value?.contains(next)) { return }
  scheduleCloseTip()
}

function markCopied() {
  copied.value = true
  if (copiedTimer) { clearTimeout(copiedTimer) }
  copiedTimer = setTimeout(() => {
    copied.value = false
    copiedTimer = null
  }, 1000)
}

async function copyHref() {
  const text = href.value
  if (!text) { return }
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

function readAttr(name: string): string | undefined {
  const attrs = props.node?.attrs
  if (!attrs) { return undefined }
  if (Array.isArray(attrs)) {
    for (const item of attrs) {
      if (Array.isArray(item) && String(item[0]).toLowerCase() === name) { return String(item[1] ?? '') }
    }
    return undefined
  }
  if (typeof attrs === 'object' && attrs[name] != null) { return String(attrs[name]) }
  return undefined
}

function resolveChild(child: { type?: string }) {
  const type = String(child?.type || 'text')
  return childComponents.value[type] || TextNode
}

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
  cancelCloseTip()
})
</script>

<style scoped>
.ms-md-link-wrap {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.ms-md-link-wrap.is-chip {
  display: inline-flex;
  max-width: min(100%, 16em);
  vertical-align: middle;
}

.ms-md-link {
  display: inline;
  color: #0969da;
  text-decoration: none;
  cursor: pointer;
}

.ms-md-link:hover .ms-md-link__label {
  text-decoration: underline;
}

.ms-md-link.is-chip {
  display: inline-flex;
  gap: 0.35em;
  align-items: center;
  max-width: 100%;
  padding: 0.15em 0.55em;
  color: #1f2328;
  font-size: 90%;
  line-height: 1.35;
  white-space: nowrap;
  vertical-align: middle;
  background: rgb(175 184 193 / 20%);
  border-radius: 999px;
}

.ms-md-link.is-chip:hover {
  background: rgb(175 184 193 / 32%);
}

.ms-md-link.is-chip-pending {
  min-width: 1.75em;
  min-height: 1.55em;
  padding: 0.15em 0.45em;
  cursor: default;
}

.ms-md-link.is-chip-pending:hover {
  background: rgb(175 184 193 / 20%);
}

.ms-md-link.is-chip-unknown {
  color: #59636e;
  cursor: default;
}

.ms-md-link.is-chip-unknown:hover {
  background: rgb(175 184 193 / 20%);
}

.ms-md-link__chip-spinner {
  flex-shrink: 0;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  border: 1.5px solid rgb(89 99 110 / 20%);
  border-top-color: #59636e;
  border-radius: 50%;
  animation: ms-chip-spin 0.7s linear infinite;
}

@keyframes ms-chip-spin {
  to {
    transform: rotate(360deg);
  }
}

.ms-md-link__chip-favicon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  object-fit: contain;
  border-radius: 2px;
}

.ms-md-link__chip-favicon--fallback {
  color: #59636e;
}

.ms-md-link__chip-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-md-link__label {
  text-decoration: inherit;
}

.ms-md-link__icon {
  width: calc(1em - 2px);
  height: calc(1em - 2px);
  margin: 0 0 0 0.5ch;
  color: currentcolor;
  transform: translateY(-3px);
  pointer-events: none;
}

.ms-md-link__bubble {
  --arrow-x: 50%;

  /* Teleport + fixed：脱离祖先 transform/overflow，短纸面也能看见 */
  position: fixed;
  z-index: 10000;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  box-sizing: border-box;
  max-width: min(420px, 80vw);
  padding: 4px 6px 4px 10px;
  color: #1f2328;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(31 35 40 / 12%);
}

.ms-md-link__bubble::after {
  position: absolute;
  left: var(--arrow-x);
  width: 0;
  height: 0;
  border: 5px solid transparent;
  transform: translateX(-50%);
  content: '';
}

.ms-md-link__bubble.is-top::after {
  top: 100%;
  border-top-color: #fff;
  border-bottom-color: transparent;
  filter: drop-shadow(0 1px 0 #d0d7de);
}

.ms-md-link__bubble.is-bottom::after {
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: #fff;
  filter: drop-shadow(0 -1px 0 #d0d7de);
}

.ms-md-link__favicon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  object-fit: contain;
  border-radius: 2px;
}

.ms-md-link__favicon--fallback {
  color: #59636e;
}

.ms-md-link__url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-md-link__copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: #59636e;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.ms-md-link__copy:hover {
  background: #f0f2f4;
}

.ms-md-link.is-loading {
  cursor: default;
  opacity: 0.7;
}
</style>
