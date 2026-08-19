// character-overlay: 角色浮层 UI。
//
// 右下角常驻浮层：透明无容器底（无背景色），金色发光背光（drop-shadow
// 光晕 + radial-gradient 呼吸，对齐 skin-preview demo .character-stage），
// img 播放当前态 webp，状态切换按 getTransitionPath 播过渡段
// （缺段 crossfade），台词气泡淡入淡出后自动隐去。
//
// 素材经 /pet/jiangxiao/<file> 加载，按需加载（当前态 + 预取下一段，不预载全部 46 个）。
// 未导入素材时（启动探测 /pet/jiangxiao/idle.webp 404）浮层不渲染。
//
// 浮层 DOM 直挂 document.body，带 data-jx-overlay="character" 标记，
// 背光层带 data-jx-backlight 标记。pointer-events: none（不拦截操作）。
// 背光呼吸跟随 fx-breathe 开关（CSS 门控）与 prefers-reduced-motion。

import type { CharacterState } from './character-state.ts'
import {
  getTransitionPath as defaultGetTransitionPath,
  type TransitionSegment,
} from './character-transition.ts'

/** 浮层 DOM 标记属性名。 */
export const OVERLAY_ATTR = 'data-jx-overlay'

/** 浮层 DOM 标记属性值。 */
export const OVERLAY_VALUE = 'character'

/** 背光层 DOM 标记属性名。 */
export const BACKLIGHT_ATTR = 'data-jx-backlight'

/** 素材 URL 前缀（dsh-pet 服务）。 */
export const PET_BASE = '/pet/jiangxiao'

/**
 * 探测素材是否就绪（HEAD /pet/jiangxiao/idle.webp）。
 *
 * 200 -> true（就绪）；404/网络异常/fetch 不可用 -> false（未导入）。
 * 保守降级：检测失败不报错，调用方视为未导入。
 */
export async function probeAssetReady(): Promise<boolean> {
  if (typeof fetch !== 'function') return false
  try {
    const probe = await fetch(`${PET_BASE}/idle.webp`, { method: 'HEAD' })
    return probe.ok
  } catch {
    return false
  }
}

/** 台词气泡自动隐去延时（ms）。 */
const LINE_AUTO_HIDE_MS = 4000

/** crossfade 时长（ms）。 */
const CROSSFADE_MS = 300

/** 浮层容器固定定位（右下角）。 */
const OVERLAY_POSITION_CSS =
  'position:fixed;right:18px;bottom:18px;width:160px;height:200px;' +
  'z-index:2147483646;pointer-events:none'

/** img 透明无底样式 + 金色发光背光（drop-shadow 光晕勾勒角色轮廓）。 */
const IMG_CSS =
  'position:absolute;inset:0;width:100%;height:100%;z-index:1;' +
  'object-fit:contain;display:block;pointer-events:none;' +
  'filter:drop-shadow(0 0 16px color-mix(in srgb, var(--jx-gold, #d6b34a) 28%, transparent))'

/** 背光层样式：radial 金色光晕（比 img 大一圈，呼吸动画由 WAAPI 驱动）。
 * 容器本身无背景——背光是独立光晕层，不是容器底色。 */
const BACKLIGHT_CSS =
  'position:absolute;inset:-24px;z-index:0;pointer-events:none;' +
  'background:radial-gradient(circle, color-mix(in srgb, var(--jx-gold, #d6b34a) 14%, transparent), transparent 70%);' +
  'opacity:0.85'

/** 背光呼吸时长（ms），对齐 demo 的 6s。 */
const BACKLIGHT_BREATHE_MS = 6000

/** 台词气泡样式：金边楷书质感（对齐 demo .character-bubble），淡入淡出用 opacity + translateY。 */
const BUBBLE_CSS =
  'position:absolute;left:50%;bottom:100%;transform:translate(-50%, 8px);' +
  'max-width:220px;padding:8px 14px;z-index:2;' +
  'border-radius:12px 12px 2px 12px;' +
  'background:color-mix(in srgb, var(--jx-surface-2, #1a1620) 92%, transparent);' +
  'border:1px solid color-mix(in srgb, var(--jx-gold-deep, #b8860b) 38%, transparent);' +
  'color:var(--jx-gold-bright, #f6d365);' +
  'font-family:var(--jx-font-display, "Kaiti SC", "STKaiti", serif);' +
  'font-size:13px;line-height:1.6;text-align:center;letter-spacing:0.04em;pointer-events:none;' +
  'opacity:0;transition:opacity 200ms ease, transform 200ms ease;' +
  'white-space:nowrap;overflow:hidden;text-overflow:ellipsis'

/** 浮层控制器。 */
export interface CharacterOverlay {
  /** 切换角色状态，可选附带台词（气泡淡入淡出后自动隐去）。 */
  setState(state: CharacterState, line?: string): void
  /** 拆除浮层，移出 DOM。 */
  dispose(): void
}

/** 初始化选项（测试用：可注入 getTransitionPath 覆盖）。 */
export interface CharacterOverlayOptions {
  /** 过渡段解析函数（默认用 character-transition 的 getTransitionPath）。 */
  getTransitionPath?: (from: CharacterState, to: CharacterState) => TransitionSegment[]
}

/**
 * 初始化角色浮层。
 *
 * 启动探测 /pet/jiangxiao/idle.webp：404 或 fetch 不可用 → 返回 null（浮层不渲染）。
 * 探测成功 → 创建浮层 DOM 直挂 document.body（透明无容器底 + 金色发光背光层），
 * 返回控制器。
 *
 * 按需加载：只加载当前态 webp + 预取过渡段下一段；不预载全部 46 个素材。
 * 状态切换播放过渡段，过渡段播完释放（src 置空）；缺段自动 crossfade。
 */
export async function initCharacterOverlay(
  opts?: CharacterOverlayOptions,
): Promise<CharacterOverlay | null> {
  const resolvePath = opts?.getTransitionPath ?? defaultGetTransitionPath

  // 启动探测：idle.webp 是否存在。
  if (!(await probeAssetReady())) return null

  // 检测 reduced-motion：浮层装饰/动画遵守。
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // --- 创建浮层 DOM ----------------------------------------------------------
  const container = document.createElement('div')
  container.setAttribute(OVERLAY_ATTR, OVERLAY_VALUE)
  container.setAttribute('aria-hidden', 'true')
  container.style.cssText = OVERLAY_POSITION_CSS

  // 金色发光背光层（容器无背景色；背光是独立光晕层）。
  const backlight = document.createElement('div')
  backlight.setAttribute(BACKLIGHT_ATTR, '')
  backlight.style.cssText = BACKLIGHT_CSS
  container.appendChild(backlight)

  // 背光呼吸：非 reduced-motion 且有 WAAPI 时启动；否则静态光晕。
  let backlightAnim: Animation | undefined
  if (!reduced && typeof Element.prototype.animate === 'function') {
    backlightAnim = backlight.animate(
      [{ opacity: 0.7 }, { opacity: 1 }, { opacity: 0.7 }],
      { duration: BACKLIGHT_BREATHE_MS, iterations: Infinity, easing: 'ease-in-out' },
    )
  }

  const img = document.createElement('img')
  img.alt = ''
  img.style.cssText = IMG_CSS
  img.src = `${PET_BASE}/idle.webp`
  container.appendChild(img)

  // 台词气泡（初始隐藏）。
  const bubble = document.createElement('div')
  bubble.style.cssText = BUBBLE_CSS
  container.appendChild(bubble)

  document.body.appendChild(container)

  // --- 状态机 ----------------------------------------------------------------
  let current: CharacterState = 'idle'
  let transitioning = false
  let lineTimer: ReturnType<typeof setTimeout> | undefined
  const timers: Set<ReturnType<typeof setTimeout>> = new Set()

  function setTimer(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
    const t = setTimeout(() => {
      timers.delete(t)
      fn()
    }, ms)
    timers.add(t)
    return t
  }

  /** 预取一个 webp（低优先级，不阻塞）。 */
  function prefetch(url: string): void {
    if (typeof fetch !== 'function') return
    try {
      fetch(url, { method: 'GET' }).catch(() => {})
    } catch {
      // 预取失败不影响播放
    }
  }

  /** 加载并播放一个过渡段，播完释放（src 置空）。 */
  function playSegment(seg: TransitionSegment): Promise<void> {
    return new Promise((resolve) => {
      const url = `${PET_BASE}/${seg.webp}`
      img.src = url
      const dur = reduced ? 1 : seg.durationMs
      setTimer(() => {
        // 段播完释放
        resolve()
      }, dur)
    })
  }

  /** crossfade 兜底：旧图淡出 + 新图淡入。 */
  function crossfadeTo(target: CharacterState): void {
    const targetUrl = `${PET_BASE}/${target}.webp`
    if (reduced) {
      img.src = targetUrl
      return
    }
    // 创建临时第二 img 交叉淡入。
    const fadeImg = document.createElement('img')
    fadeImg.alt = ''
    fadeImg.style.cssText =
      IMG_CSS + ';opacity:0;transition:opacity ' + CROSSFADE_MS + 'ms ease'
    fadeImg.src = targetUrl
    container.insertBefore(fadeImg, img)
    // 触发淡入
    requestAnimationFrame(() => {
      fadeImg.style.opacity = '1'
      img.style.opacity = '0'
    })
    setTimer(() => {
      img.src = targetUrl
      img.style.opacity = '1'
      fadeImg.remove()
    }, CROSSFADE_MS)
  }

  /** 显示台词气泡（淡入，自动淡出隐去）。 */
  function showLine(text: string): void {
    if (lineTimer !== undefined) {
      clearTimeout(lineTimer)
      timers.delete(lineTimer)
    }
    bubble.textContent = text
    // 淡入
    bubble.style.opacity = '1'
    bubble.style.transform = 'translate(-50%, 0)'
    // 自动隐去
    lineTimer = setTimer(() => {
      bubble.style.opacity = '0'
      bubble.style.transform = 'translate(-50%, 8px)'
      lineTimer = undefined
    }, LINE_AUTO_HIDE_MS)
  }

  /** 切换状态：播过渡段序列，缺段 crossfade。 */
  function setState(state: CharacterState, line?: string): void {
    if (line !== undefined) showLine(line)
    if (state === current || transitioning) {
      // 同态或过渡中：仅切图（crossfade 兜底）
      if (state !== current) crossfadeTo(state)
      current = state
      return
    }

    const path = resolvePath(current, state)
    if (path.length === 0) {
      // 缺段 → crossfade 兜底
      crossfadeTo(state)
      current = state
      return
    }

    // 播过渡段序列。预取下一段（若 2 段）。
    transitioning = true
    if (path.length > 1) prefetch(`${PET_BASE}/${path[1]!.webp}`)

    void (async () => {
      for (const seg of path) {
        await playSegment(seg)
      }
      // 过渡段播完：切到目标态循环 webp，释放过渡 src
      img.src = `${PET_BASE}/${state}.webp`
      current = state
      transitioning = false
    })()
  }

  function dispose(): void {
    for (const t of timers) clearTimeout(t)
    timers.clear()
    if (lineTimer !== undefined) clearTimeout(lineTimer)
    backlightAnim?.cancel()
    backlightAnim = undefined
    container.remove()
  }

  // 素材加载失败降级：img onerror 时回 idle 态，避免卡在坏帧。
  // probeAssetReady 已确认 idle.webp 就绪（否则浮层不渲染），故回 idle 安全。
  img.addEventListener('error', () => setState('idle'))

  return { setState, dispose }
}
