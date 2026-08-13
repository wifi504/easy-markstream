<template>
  <div class="ms-sources">
    <hover-popover interactive>
      <span class="ms-sources__trigger" tabindex="0" aria-label="来源">
        <span class="ms-sources__label">来源：</span>
        <span class="ms-sources__icons" aria-hidden="true">
          <span
            v-for="(slot, i) in iconSlots"
            :key="`${slot.kind}-${slot.key}-${i}`"
            class="ms-sources__icon"
            :style="{ zIndex: i + 1 }"
          >
            <template v-if="slot.kind === 'more'">
              <span class="ms-sources__more">+{{ slot.count }}</span>
            </template>
            <template v-else>
              <img
                v-if="faviconUrl(slot.item, slot.idx)"
                class="ms-sources__favicon"
                :src="faviconUrl(slot.item, slot.idx)"
                alt=""
                width="18"
                height="18"
                decoding="async"
                @error="onFaviconError(slot.idx)"
              >
              <svg
                v-else
                class="ms-sources__favicon ms-sources__favicon--fallback"
                viewBox="0 0 16 16"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path fill="currentColor" d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0m-.5 1.56A6.5 6.5 0 0 0 1.56 7.5h2.1c.1-1.4.4-2.7.85-3.82A12 12 0 0 1 7.5 1.56m1 0c1.05.4 1.95 1.5 2.5 2.12.45 1.12.75 2.42.85 3.82h2.1A6.5 6.5 0 0 0 8.5 1.56M1.56 8.5A6.5 6.5 0 0 0 7.5 14.44c-.9-.8-1.6-2.1-2-3.72-.3-1.15-.5-2.4-.59-3.72h-3.35Zm5.04 0c.1 1.45.32 2.8.66 3.9.35 1.1.8 1.9 1.24 2.28.44-.38.89-1.18 1.24-2.28.34-1.1.56-2.45.66-3.9H6.6Zm5.15 0c-.09 1.32-.29 2.57-.59 3.72-.4 1.62-1.1 2.92-2 3.72A6.5 6.5 0 0 0 14.44 8.5h-2.69Z" />
              </svg>
            </template>
          </span>
        </span>
      </span>

      <template #tip>
        <div ref="panelEl" class="ms-sources__panel">
          <easy-markstream
            :content="sourcesMd"
            :final="true"
            :show-sources="false"
            :floating-ui="false"
          />
        </div>
      </template>
    </hover-popover>
  </div>
</template>

<script setup lang="ts">
import type { MarkdownReferenceItem } from '../utils/collect-markdown-references-util'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { buildSourcesMarkdown } from '../utils/build-sources-markdown-util'
import { faviconCandidatesForHref } from '../utils/link-label-util'
import { bindOverlayVScroll, unbindOverlayVScroll } from '../utils/overlay-vscroll-util'
import HoverPopover from './HoverPopover.vue'

const props = defineProps<{
  items: MarkdownReferenceItem[]
}>()

const EasyMarkstream = defineAsyncComponent(() => import('../EasyMarkstream.vue'))

const panelEl = ref<HTMLElement | null>(null)

/** 每个来源条目当前 favicon 候选下标 */
const faviconIndexMap = ref<Record<number, number>>({})

const sourcesMd = computed(() => buildSourcesMarkdown(props.items))

async function bindPanelScroll() {
  await nextTick()
  if (panelEl.value) { bindOverlayVScroll(panelEl.value) }
}

type IconSlot
  = | { kind: 'fav', key: string, item: MarkdownReferenceItem, idx: number }
    | { kind: 'more', key: string, count: number }

/** ≤3 全展示；>3 时前 3 个 + +(剩余) */
const iconSlots = computed((): IconSlot[] => {
  const list = props.items
  if (list.length <= 3) {
    return list.map((item, idx) => ({
      kind: 'fav' as const,
      key: item.id,
      item,
      idx,
    }))
  }
  const slots: IconSlot[] = list.slice(0, 3).map((item, idx) => ({
    kind: 'fav' as const,
    key: item.id,
    item,
    idx,
  }))
  slots.push({
    kind: 'more',
    key: 'more',
    count: list.length - 3,
  })
  return slots
})

function candidates(item: MarkdownReferenceItem) {
  return faviconCandidatesForHref(item.href)
}

function faviconUrl(item: MarkdownReferenceItem, idx: number) {
  const list = candidates(item)
  const i = faviconIndexMap.value[idx] ?? 0
  return list[i] || ''
}

function onFaviconError(idx: number) {
  const item = props.items[idx]
  if (!item) { return }
  const list = candidates(item)
  const cur = faviconIndexMap.value[idx] ?? 0
  faviconIndexMap.value = {
    ...faviconIndexMap.value,
    [idx]: cur + 1 > list.length ? list.length : cur + 1,
  }
}

watch(() => props.items, () => {
  faviconIndexMap.value = {}
  void bindPanelScroll()
}, { deep: true })

watch(sourcesMd, () => {
  void bindPanelScroll()
})

onMounted(() => {
  void bindPanelScroll()
})

onBeforeUnmount(() => {
  unbindOverlayVScroll(panelEl.value)
})
</script>

<style scoped>
.ms-sources {
  margin-top: 16px;
}

.ms-sources__trigger {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: #59636e;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: default;
}

.ms-sources__trigger:hover {
  color: #1f2328;
}

.ms-sources__label {
  flex-shrink: 0;
}

.ms-sources__icons {
  display: inline-flex;
  align-items: center;
  padding-left: 4px;
}

.ms-sources__icon {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: -6px;
  overflow: hidden;
  background: #f0f2f4;
  border: 1.5px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgb(31 35 40 / 8%);
}

.ms-sources__icon:first-child {
  margin-left: 0;
}

.ms-sources__favicon {
  display: block;
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.ms-sources__favicon--fallback {
  width: 14px;
  height: 14px;
  color: #59636e;
}

.ms-sources__more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
  font-weight: 600;
  font-size: 10px;
  line-height: 1;
  background: #8b949e;
}

.ms-sources__panel {
  box-sizing: border-box;
  min-width: 220px;
  max-width: min(420px, 86vw);
  max-height: min(360px, 50vh);
  padding: 10px 12px;
  overflow: auto;
  color: #1f2328;
  font-size: 13px;
  line-height: 1.5;

  /* 原生条由 overlay-vscroll-util 隐藏，改用悬浮细条（无上下箭头） */
}

.ms-sources__panel :deep(.easy-markstream) {
  margin: 0;
}

.ms-sources__panel :deep(.easy-markstream > .markstream-vue) {
  font-size: 13px;
}

.ms-sources__panel :deep(ul) {
  margin: 0 !important;
}
</style>
