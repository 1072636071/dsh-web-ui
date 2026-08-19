// @vitest-environment jsdom
/**
 * 工单 03：FX 特效系统单测 — fx-* 类切换与 localStorage 持久化。
 *
 * 只测外部行为：html fx-* 类开关、localStorage('jx-fx') 读写、
 * prefers-reduced-motion 强制全关、initFxSystem 编排。不测 CSS 色值/WAAPI 细节。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FX_KEYS,
  FX_STORAGE_KEY,
  DEFAULT_FX_STATE,
  FALL_PIECES,
  loadFxState,
  saveFxState,
  effectiveFxState,
  applyFxState,
  initFxSystem,
  type FxKey,
  type FxState,
} from '../src/client/fx-system.ts'

afterEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('DEFAULT_FX_STATE — all 5 fx default on', () => {
  it('every fx key defaults to true', () => {
    for (const k of FX_KEYS) {
      expect(DEFAULT_FX_STATE[k]).toBe(true)
    }
  })
  it('has exactly 5 keys: shimmer/fall/grain/breathe/micro', () => {
    expect(FX_KEYS).toEqual(['shimmer', 'fall', 'grain', 'breathe', 'micro'])
  })
})

describe('loadFxState — merge with defaults', () => {
  it('empty localStorage returns defaults', () => {
    expect(loadFxState()).toEqual(DEFAULT_FX_STATE)
  })
  it('partial stored state merges with defaults', () => {
    saveFxState({ ...DEFAULT_FX_STATE, fall: false })
    const s = loadFxState()
    expect(s.fall).toBe(false)
    expect(s.shimmer).toBe(true)
  })
  it('invalid JSON returns defaults', () => {
    localStorage.setItem(FX_STORAGE_KEY, 'not-json')
    expect(loadFxState()).toEqual(DEFAULT_FX_STATE)
  })
  it('unknown keys ignored, missing keys defaulted', () => {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify({ shimmer: false, bogus: true }))
    const s = loadFxState()
    expect(s.shimmer).toBe(false)
    expect(s.fall).toBe(true)
    expect((s as Record<string, unknown>).bogus).toBeUndefined()
  })
  it('non-boolean values ignored', () => {
    localStorage.setItem(FX_STORAGE_KEY, JSON.stringify({ shimmer: 'yes', fall: 1 }))
    const s = loadFxState()
    expect(s.shimmer).toBe(true)
    expect(s.fall).toBe(true)
  })
})

describe('saveFxState — persists to localStorage', () => {
  it('writes JSON to jx-fx key', () => {
    saveFxState({ ...DEFAULT_FX_STATE, grain: false })
    const raw = localStorage.getItem(FX_STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({ ...DEFAULT_FX_STATE, grain: false })
  })
})

describe('applyFxState — toggles html fx-* classes', () => {
  it('all on -> all 5 fx-* classes present on html', () => {
    applyFxState(DEFAULT_FX_STATE)
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(true)
    }
  })
  it('all off -> no fx-* classes on html', () => {
    const allOff: FxState = { shimmer: false, fall: false, grain: false, breathe: false, micro: false }
    applyFxState(allOff)
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(false)
    }
  })
  it('partial -> only enabled classes present', () => {
    applyFxState({ ...DEFAULT_FX_STATE, fall: false, grain: false })
    const html = document.documentElement
    expect(html.classList.contains('fx-shimmer')).toBe(true)
    expect(html.classList.contains('fx-fall')).toBe(false)
    expect(html.classList.contains('fx-grain')).toBe(false)
    expect(html.classList.contains('fx-breathe')).toBe(true)
  })
})

describe('effectiveFxState — prefers-reduced-motion forces all off', () => {
  it('no reduced motion -> returns state unchanged', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
    const s = effectiveFxState(DEFAULT_FX_STATE)
    expect(s).toEqual(DEFAULT_FX_STATE)
  })
  it('reduced motion -> all 5 fx false', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
    const s = effectiveFxState(DEFAULT_FX_STATE)
    for (const k of FX_KEYS) {
      expect(s[k]).toBe(false)
    }
  })
  it('matchMedia absent -> no reduced motion (returns state)', () => {
    vi.stubGlobal('matchMedia', undefined)
    const s = effectiveFxState(DEFAULT_FX_STATE)
    expect(s).toEqual(DEFAULT_FX_STATE)
  })
})

describe('initFxSystem — orchestration', () => {
  it('init applies default state to html (all fx-* classes)', () => {
    const sys = initFxSystem()
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(true)
    }
    sys.dispose()
  })

  it('setFx toggles html class and persists to localStorage', () => {
    const sys = initFxSystem()
    sys.setFx('fall', false)
    expect(document.documentElement.classList.contains('fx-fall')).toBe(false)
    expect(loadFxState().fall).toBe(false)
    sys.setFx('fall', true)
    expect(document.documentElement.classList.contains('fx-fall')).toBe(true)
    expect(loadFxState().fall).toBe(true)
    sys.dispose()
  })

  it('setAll(false) removes all fx-* classes and persists', () => {
    const sys = initFxSystem()
    sys.setAll(false)
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(false)
    }
    const persisted = loadFxState()
    for (const k of FX_KEYS) {
      expect(persisted[k]).toBe(false)
    }
    sys.dispose()
  })

  it('setAll(true) restores all fx-* classes', () => {
    const sys = initFxSystem()
    sys.setAll(false)
    sys.setAll(true)
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(true)
    }
    sys.dispose()
  })

  it('dispose removes all fx-* classes from html', () => {
    const sys = initFxSystem()
    sys.dispose()
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(false)
    }
  })

  it('init loads persisted state (not defaults)', () => {
    saveFxState({ ...DEFAULT_FX_STATE, shimmer: false, breathe: false })
    const sys = initFxSystem()
    expect(document.documentElement.classList.contains('fx-shimmer')).toBe(false)
    expect(document.documentElement.classList.contains('fx-breathe')).toBe(false)
    expect(document.documentElement.classList.contains('fx-fall')).toBe(true)
    sys.dispose()
  })

  it('getAll returns current state snapshot', () => {
    const sys = initFxSystem()
    sys.setFx('grain', false)
    const s = sys.getAll()
    expect(s.grain).toBe(false)
    expect(s.shimmer).toBe(true)
    sys.dispose()
  })

  it('reduced motion at init -> all fx-* classes absent', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
    const sys = initFxSystem()
    const html = document.documentElement
    for (const k of FX_KEYS) {
      expect(html.classList.contains(`fx-${k}`)).toBe(false)
    }
    sys.dispose()
  })
})

describe('fx-* class contract — full-off equals original skin (no fx-* classes)', () => {
  it('setAll(false) then dispose leaves zero fx-* classes', () => {
    const sys = initFxSystem()
    sys.setAll(false)
    sys.dispose()
    const html = document.documentElement
    const fxClasses = Array.from(html.classList).filter((c) => c.startsWith('fx-'))
    expect(fxClasses).toEqual([])
  })
})

describe('fall DOM contract — 8 片飘片容器（设计上限）', () => {
  it('fall on -> data-jx-fx=fall container with exactly FALL_PIECES children on body', () => {
    const sys = initFxSystem()
    const container = document.querySelector('[data-jx-fx="fall"]')
    expect(container).not.toBeNull()
    expect(container!.parentElement).toBe(document.body)
    expect(container!.children.length).toBe(FALL_PIECES)
    expect(FALL_PIECES).toBeLessThanOrEqual(8)
    sys.dispose()
  })

  it('fall container is decorative (pointer-events none, aria-hidden)', () => {
    const sys = initFxSystem()
    const container = document.querySelector('[data-jx-fx="fall"]') as HTMLElement
    expect(container.style.pointerEvents).toBe('none')
    expect(container.getAttribute('aria-hidden')).toBe('true')
    sys.dispose()
  })

  it('setFx(fall, false) removes the container; re-enable re-injects it', () => {
    const sys = initFxSystem()
    sys.setFx('fall', false)
    expect(document.querySelector('[data-jx-fx="fall"]')).toBeNull()
    sys.setFx('fall', true)
    expect(document.querySelector('[data-jx-fx="fall"]')).not.toBeNull()
    sys.dispose()
  })

  it('dispose removes the fall container', () => {
    const sys = initFxSystem()
    sys.dispose()
    expect(document.querySelector('[data-jx-fx="fall"]')).toBeNull()
  })

  it('fall off at init (persisted) -> no container', () => {
    saveFxState({ ...DEFAULT_FX_STATE, fall: false })
    const sys = initFxSystem()
    expect(document.querySelector('[data-jx-fx="fall"]')).toBeNull()
    sys.dispose()
  })
})
