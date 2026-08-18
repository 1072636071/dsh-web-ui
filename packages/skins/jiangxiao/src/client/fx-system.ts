// fx-system: FX 特效系统控制器（DESIGN.md §5）。
//
// 五效：shimmer 鎏金流光 / fall 银杏梅花飘落 / grain 墨韵暗纹 /
//       breathe 墨光呼吸 / micro 微交互。
//
// 控制契约：html 上 fx-* 类为开关信号，localStorage('jx-fx') 持久化。
// 默认全开；可独立关；全关 = html 无任何 fx-* 类 = 与原版皮肤零差异。
// prefers-reduced-motion 下全部强制关闭。
//
// shimmer/breathe/micro 纯 CSS（jiangxiao.module.css 里 html.fx-* 门控）。
// fall 用 Web Animations API + GPU transform（12 片），CSS body::before 仅作
// 无 WAAPI 环境的降级 fallback（html.fx-fall-waapi 抑制 CSS fallback）。
// grain 静态 SVG turbulence，零热循环（不频繁重绘）。
//
// 装饰层一律 pointer-events: none，不拦截操作。

/** 五类特效 key（DESIGN.md §5 逐字一致）。 */
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

// --- 银杏叶 / 梅花 SVG（WAAPI fall 用）-----------------------------------------
// 与 jiangxiao.module.css 的 body::before SVG 同源（暗银杏 / 浅梅花）。

const GINKGO_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<path d='M50 96L50 72C40 70 24 64 18 50C14 38 20 22 34 16C42 13 47 20 50 20C53 20 58 13 66 16C80 22 86 38 82 50C76 64 60 70 50 72Z' fill='%23d6b34a'/>" +
  "<path d='M50 72L18 50M50 72L34 16M50 72L50 20M50 72L66 16M50 72L82 50' fill='none' stroke='%23996515' stroke-width='1.2' stroke-opacity='0.6'/>" +
  '</svg>'

const PETAL_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>" +
  "<g fill='%23d97a8e'>" +
  "<path d='M50 50C40 40 40 25 50 22C60 25 60 40 50 50Z'/>" +
  "<path d='M50 50C40 40 40 25 50 22C60 25 60 40 50 50Z' transform='rotate(72 50 50)'/>" +
  "<path d='M50 50C40 40 40 25 50 22C60 25 60 40 50 50Z' transform='rotate(144 50 50)'/>" +
  "<path d='M50 50C40 40 40 25 50 22C60 25 60 40 50 50Z' transform='rotate(216 50 50)'/>" +
  "<path d='M50 50C40 40 40 25 50 22C60 25 60 40 50 50Z' transform='rotate(288 50 50)'/>" +
  '</g>' +
  "<circle cx='50' cy='50' r='5' fill='%23b24a5c'/>" +
  '</svg>'

/** fall 飘落片数（DESIGN.md §5：12 片）。 */
const FALL_PIECES = 12

/**
 * 启动 WAAPI 飘落（12 片，GPU transform）。
 * 无 Element.animate（如 jsdom）时 no-op，CSS body::before fallback 接管。
 * 返回 dispose 函数：取消动画、移除容器、释放 fx-fall-waapi 标记。
 */
function startFall(): () => void {
  if (typeof document === 'undefined' || typeof Element.prototype.animate !== 'function') {
    return () => {}
  }
  // 标记 WAAPI 生效，抑制 CSS body::before fallback
  document.documentElement.classList.add('fx-fall-waapi')

  const container = document.createElement('div')
  container.dataset.jxFx = 'fall'
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText =
    'position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden'

  // 浅色信号：body 无 data-ds-dark-theme（暗为默认）
  const light = !document.body.hasAttribute('data-ds-dark-theme')
  const svg = light ? PETAL_SVG : GINKGO_SVG

  const animations: Animation[] = []
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  for (let i = 0; i < FALL_PIECES; i++) {
    const el = document.createElement('div')
    const size = 24 + Math.random() * 20
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size * 1.3}px;` +
      `left:${Math.random() * 100}%;top:-60px;` +
      'will-change:transform,opacity;opacity:0'
    el.innerHTML = svg
    container.appendChild(el)

    const dx = (Math.random() - 0.5) * 240
    const duration = 9000 + Math.random() * 7000
    const delay = Math.random() * 9000
    const rotate = 360 + Math.random() * 540
    const peakOpacity = 0.32 + Math.random() * 0.22

    const anim = el.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px, ${vh * 0.15}px) rotate(${rotate * 0.2}deg)`, opacity: peakOpacity, offset: 0.12 },
        { transform: `translate(${dx}px, ${vh + 80}px) rotate(${rotate}deg)`, opacity: 0 },
      ],
      { duration, delay, iterations: Infinity, easing: 'linear' },
    )
    animations.push(anim)
  }

  document.body.appendChild(container)

  return () => {
    for (const a of animations) a.cancel()
    container.remove()
    document.documentElement.classList.remove('fx-fall-waapi')
  }
}

/**
 * 启动 grain 墨韵暗纹：静态 SVG turbulence filter，零热循环（无 animation）。
 * mix-blend-mode: overlay + 低 opacity，不干扰内容。
 */
function startGrain(): () => void {
  if (typeof document === 'undefined') return () => {}
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.dataset.jxFx = 'grain'
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText =
    'position:fixed;inset:0;z-index:0;pointer-events:none;' +
    'width:100%;height:100%;opacity:0.035;mix-blend-mode:overlay'
  // 静态 turbulence：无 animation，不重绘（零热循环）。
  svg.innerHTML =
    "<filter id='jx-grain-filter' x='0' y='0' width='100%' height='100%'>" +
    "<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>" +
    "<feColorMatrix type='saturate' values='0'/>" +
    '</filter>' +
    "<rect width='100%' height='100%' filter='url(#jx-grain-filter)'/>"
  document.body.appendChild(svg)
  return () => svg.remove()
}

// --- 编排器 --------------------------------------------------------------------

/** FX 系统控制器：读写状态、同步 html 类、管理 JS 驱动的 fall/grain。 */
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
 * 启动 JS 驱动的 fall/grain。返回控制器。同一时刻仅一个全局实例。
 */
export function initFxSystem(): FxSystem {
  const initial = effectiveFxState(loadFxState())
  let state: FxState = { ...initial }
  applyFxState(state)

  let fallDispose: (() => void) | undefined
  let grainDispose: (() => void) | undefined
  if (state.fall) fallDispose = startFall()
  if (state.grain) grainDispose = startGrain()

  function sync(key: FxKey): void {
    document.documentElement.classList.toggle(fxClass(key), state[key])
    if (key === 'fall') {
      if (state.fall && fallDispose === undefined) fallDispose = startFall()
      else if (!state.fall && fallDispose !== undefined) {
        fallDispose()
        fallDispose = undefined
      }
    }
    if (key === 'grain') {
      if (state.grain && grainDispose === undefined) grainDispose = startGrain()
      else if (!state.grain && grainDispose !== undefined) {
        grainDispose()
        grainDispose = undefined
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
      document.documentElement.classList.remove('fx-fall-waapi')
      fallDispose?.()
      grainDispose?.()
      fallDispose = undefined
      grainDispose = undefined
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
