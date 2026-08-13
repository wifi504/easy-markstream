<template>
  <span
    ref="rootEl"
    class="hover-popover"
    @mouseenter="open"
    @mouseleave="scheduleClose"
    @focusin="open"
    @focusout="onFocusOut"
  >
    <slot />
    <teleport to="body">
      <span
        v-show="visible"
        ref="tipEl"
        class="hover-popover__tip"
        :class="[
          placement === 'bottom' ? 'is-bottom' : 'is-top',
          { 'is-interactive': interactive, 'is-rich': isRich },
        ]"
        role="tooltip"
        :style="tipStyle"
        @mouseenter="cancelClose"
        @mouseleave="scheduleClose"
      >
        <slot name="tip">{{ content }}</slot>
      </span>
    </teleport>
  </span>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { PopoverPlacement } from '../utils/popover-boundary-util'
import { computed, inject, nextTick, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { FLOATING_UI_KEY } from '../utils/floating-ui-context'
import {
  computeFixedPopoverPosition,
  findPopoverBoundary,

} from '../utils/popover-boundary-util'

const props = withDefaults(defineProps<{
  content?: string
  /** 可悬停进 tip（富内容 / 可滚动） */
  interactive?: boolean
}>(), {
  content: '',
  interactive: false,
})

const floatingUi = inject(FLOATING_UI_KEY, ref(true))
const slots = useSlots()
const isRich = computed(() => typeof slots.tip === 'function')

const rootEl = ref<HTMLElement | null>(null)
const tipEl = ref<HTMLElement | null>(null)
const visible = ref(false)
const placement = ref<PopoverPlacement>('top')
const coords = ref({ left: 0, top: 0, arrowOffsetX: 0 })
let closeTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | undefined

const tipStyle = computed((): CSSProperties => ({
  'left': `${coords.value.left}px`,
  'top': `${coords.value.top}px`,
  '--arrow-x': `${coords.value.arrowOffsetX}px`,
}))

async function repositionTip() {
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const root = rootEl.value
  const tip = tipEl.value
  if (!root || !tip || !visible.value) { return }

  // v-show 刚打开时偶发 0 尺寸，跳过本帧等 ResizeObserver / 下一轮
  const tipWidth = tip.offsetWidth
  const tipHeight = tip.offsetHeight
  if (tipWidth < 2 || tipHeight < 2) { return }

  const pos = computeFixedPopoverPosition({
    triggerRect: root.getBoundingClientRect(),
    tipWidth,
    tipHeight,
    boundary: findPopoverBoundary(root),
    preferred: 'top',
    triggerEl: root,
  })
  placement.value = pos.placement
  coords.value = {
    left: pos.left,
    top: pos.top,
    arrowOffsetX: pos.arrowOffsetX,
  }
}

function bindResizeObserver() {
  unbindResizeObserver()
  const tip = tipEl.value
  if (!tip || typeof ResizeObserver === 'undefined') { return }
  resizeObserver = new ResizeObserver(() => {
    if (visible.value) { void repositionTip() }
  })
  resizeObserver.observe(tip)
}

function unbindResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = undefined
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function scheduleClose() {
  cancelClose()
  // 交互 tip：给移入气泡一点时间
  const delay = props.interactive ? 120 : 0
  if (delay === 0) {
    close()
    return
  }
  closeTimer = setTimeout(() => {
    close()
    closeTimer = null
  }, delay)
}

function open(e?: Event) {
  if (floatingUi.value === false) { return }
  if (e) {
    const root = e.currentTarget
    if (root instanceof HTMLElement && root.querySelector('button[disabled], [aria-disabled="true"]')) { return }
  }
  cancelClose()
  visible.value = true
  void nextTick(() => {
    bindResizeObserver()
    void repositionTip()
  })
}

function close() {
  cancelClose()
  visible.value = false
  placement.value = 'top'
  unbindResizeObserver()
}

function onFocusOut(e: FocusEvent) {
  const root = e.currentTarget
  const next = e.relatedTarget
  if (root instanceof HTMLElement && next instanceof Node && root.contains(next)) { return }
  if (props.interactive && next instanceof Node && tipEl.value?.contains(next)) { return }
  scheduleClose()
}

watch(visible, (v) => {
  if (v) { void repositionTip() }
})

onBeforeUnmount(() => {
  cancelClose()
  unbindResizeObserver()
})
</script>

<style scoped>
.hover-popover {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.hover-popover__tip {
  --arrow-x: 50%;

  position: fixed;
  z-index: 10000;
  box-sizing: border-box;
  padding: 4px 8px;
  color: #1f2328;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(31 35 40 / 12%);
  pointer-events: none;
}

.hover-popover__tip.is-interactive {
  pointer-events: auto;
}

.hover-popover__tip.is-rich {
  padding: 0;
  white-space: normal;
}

.hover-popover__tip::after {
  position: absolute;
  left: var(--arrow-x);
  width: 0;
  height: 0;
  border: 5px solid transparent;
  transform: translateX(-50%);
  content: '';
}

.hover-popover__tip.is-top::after {
  top: 100%;
  border-top-color: #fff;
  border-bottom-color: transparent;
  filter: drop-shadow(0 1px 0 #d0d7de);
}

.hover-popover__tip.is-bottom::after {
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: #fff;
  filter: drop-shadow(0 -1px 0 #d0d7de);
}
</style>
