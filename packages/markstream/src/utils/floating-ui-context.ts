import type { InjectionKey, Ref } from 'vue'

/**
 * EasyMarkstream → 子组件：是否允许 Teleport 浮层
 *（链接 tip、HoverPopover、图片灯箱等）
 */
export const FLOATING_UI_KEY: InjectionKey<Ref<boolean>> = Symbol('easy-markstream-floating-ui')

/** EasyMarkstream → 子组件：流式是否已结束（未解析引用 chip 用） */
export const MARKSTREAM_FINAL_KEY: InjectionKey<Ref<boolean>> = Symbol('easy-markstream-final')
