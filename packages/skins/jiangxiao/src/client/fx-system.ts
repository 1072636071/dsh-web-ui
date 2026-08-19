// fx-system: FX 特效系统控制器。
//
// 五效：shimmer 鎏金流光 / fall 银杏梅花飘落 / grain 墨韵暗纹 /
//       breathe 墨晕呼吸 / micro 微交互。
// 视觉实现按 .scratch/skin-preview/DESIGN.md §4（纯 CSS 见
// jiangxiao.module.css，本文件只负责 fall 飘片的 DOM 注入）。
//
// 控制契约：html 上 fx-* 类为开关信号，localStorage('jx-fx') 持久化。
// 默认全开；可独立关；全关 = html 无任何 fx-* 类 = 与原版皮肤零差异。
// prefers-reduced-motion 下全部强制关闭。
//
// shimmer/breathe/micro/grain 纯 CSS（jiangxiao.module.css 里 html.fx-*
// 门控）：grain 为静态多层 radial 墨晕零热循环；breathe 为 body::after
// opacity 呼吸。fall 由本文件注入 8 个飘片节点，动画走 CSS keyframes
// （translate3d + rotate + opacity GPU 合成，18-28s 各异轨迹）。
// 装饰层一律 pointer-events: none，不拦截操作。

/** 五类特效 key。 */
export type FxKey = 'shimmer' | 'fall' | 'grain' | 'breathe' | 'micro'

/** 特效开关状态记录。 */
export type FxState = Record<FxKey, boolean>

/** 全部 fx key（有序，用于遍历）。 */
export const FX_KEYS: readonly FxKey[] = ['shimmer', 'fall', 'grain', 'breathe', 'micro']

/** localStorage key。 */
export const FX_STORAGE_KEY = 'jx-fx'

/** 默认状态：全开。 */
export const DEFAULT_FX_STATE: FxState = {
  shimmer: true,
  fall: true,
  grain: true,
  breathe: true,
  micro: true,
}

/** fx-* 类名：fx-shimmer / fx-fall / ... */
export function fxClass(key: FxKey): string {
  return `fx-${key}`
}

/**
 * 从 localStorage 读取 fx 状态，与默认值合并。
 * 无效 JSON / 缺失 key / 非 boolean 值一律回落默认，绝不抛错。
 */
export function loadFxState(): FxState {
  const merged: FxState = { ...DEFAULT_FX_STATE }
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>
      for (const k of FX_KEYS) {
        if (typeof parsed[k] === 'boolean') merged[k] = parsed[k] as boolean
      }
    }
  } catch {
    // 损坏数据 → 默认
  }
  return merged
}

/** 将 fx 状态写入 localStorage（JSON）。 */
export function saveFxState(state: FxState): void {
  try {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 隐私模式 / 配额满 → 静默放弃持久化
  }
}

/** 检测 prefers-reduced-motion。无 matchMedia 时视为不减少。 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 计算生效状态：prefers-reduced-motion 下全部强制关闭，否则用传入状态。
 */
export function effectiveFxState(state: FxState): FxState {
  if (prefersReducedMotion()) {
    return { shimmer: false, fall: false, grain: false, breathe: false, micro: false }
  }
  return state
}

/**
 * 将 fx 状态同步到 html 元素的 fx-* 类。
 * html 无任何 fx-* 类 = 全关 = 与原版皮肤零差异。
 */
export function applyFxState(state: FxState): void {
  const html = document.documentElement
  for (const k of FX_KEYS) {
    html.classList.toggle(fxClass(k), state[k])
  }
}

/** fall 飘片数（skin-preview 设计：<= 8 片，性能与观感平衡）。 */
export const FALL_PIECES = 8

/**
 * 启动 fall 飘落：注入 fixed 容器 + 8 个飘片 div。
 * 轨迹/速度/延迟/形状/颜色全部由 jiangxiao.module.css 的
 * [data-jx-fx='fall'] nth-child 规则驱动（CSS keyframes，GPU 合成）。
 * 返回 dispose 函数：移除容器。
 */
function startFall(): () => void {
  if (typeof document === 'undefined') return () => {}

  const container = document.createElement('div')
  container.dataset.jxFx = 'fall'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText =
    'position:fixed;inset:0;z-index:0;pointer-events:none;contain:strict;overflow:hidden'

  for (let i = 0; i < FALL_PIECES; i++) {
    const el = document.createElement('div')
    container.appendChild(el)
  }

  document.body.appendChild(container)

  return () => {
    container.remove()
  }
}

// --- 编排器 --------------------------------------------------------------------

/** FX 系统控制器：读写状态、同步 html 类、管理 JS 注入的 fall 飘片。 */
export interface FxSystem {
  /** 当前状态快照。 */
  getAll(): FxState
  /** 切换单个 fx，同步 html 类 + 持久化 + 启停 JS 驱动效果。 */
  setFx(key: FxKey, enabled: boolean): void
  /** 全开 / 全关。 */
  setAll(enabled: boolean): void
  /** 拆除：移除全部 fx-* 类与 JS 装饰层。 */
  dispose(): void
}

let globalSystem: FxSystem | undefined

/**
 * 初始化 FX 系统：读取持久化状态（reduced-motion 强制全关），同步到 html，
 * 按需注入 fall 飘片容器（grain/shimmer/breathe/micro 纯 CSS 门控）。
 * 返回控制器。同一时刻仅一个全局实例。
 */
export function initFxSystem(): FxSystem {
  const initial = effectiveFxState(loadFxState())
  let state: FxState = { ...initial }
  applyFxState(state)

  let fallDispose: (() => void) | undefined
  if (state.fall) fallDispose = startFall()

  function sync(key: FxKey): void {
    document.documentElement.classList.toggle(fxClass(key), state[key])
    if (key === 'fall') {
      if (state.fall && fallDispose === undefined) fallDispose = startFall()
      else if (!state.fall && fallDispose !== undefined) {
        fallDispose()
        fallDispose = undefined
      }
    }
  }

  const sys: FxSystem = {
    getAll() {
      return { ...state }
    },
    setFx(key, enabled) {
      state = { ...state, [key]: enabled }
      saveFxState(state)
      sync(key)
    },
    setAll(enabled) {
      state = { shimmer: enabled, fall: enabled, grain: enabled, breathe: enabled, micro: enabled }
      saveFxState(state)
      for (const k of FX_KEYS) sync(k)
    },
    dispose() {
      for (const k of FX_KEYS) document.documentElement.classList.remove(fxClass(k))
      fallDispose?.()
      fallDispose = undefined
      globalSystem = undefined
    },
  }

  globalSystem = sys
  return sys
}

/** 取全局 FX 系统实例（由 initFxSystem 注册）。设置卡消费此实例同步开关。 */
export function getFxSystem(): FxSystem | undefined {
  return globalSystem
}
