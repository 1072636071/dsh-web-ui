// @vitest-environment jsdom
/**
 * 工单 05：角色浮层单测 — DOM 存在性 / 透明无底契约 / 素材缺失不渲染 /
 * 缺段 crossfade 兜底。
 *
 * 只测外部行为，不测 CSS 色值/动画时序。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  initCharacterOverlay,
  OVERLAY_ATTR,
  OVERLAY_VALUE,
  PET_BASE,
  type CharacterOverlayOptions,
} from '../src/client/character-overlay.ts'
import type { TransitionSegment } from '../src/client/character-transition.ts'
import type { CharacterState } from '../src/client/character-state.ts'

function mockFetchOk(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200 }),
  )
}

function mockFetch404(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: false, status: 404 }),
  )
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('initCharacterOverlay — 404 probe -> no overlay', () => {
  it('returns null and renders no overlay when idle.webp is 404', async () => {
    mockFetch404()
    const overlay = await initCharacterOverlay()
    expect(overlay).toBeNull()
    expect(document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`)).toBeNull()
  })

  it('returns null on fetch error (network)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const overlay = await initCharacterOverlay()
    expect(overlay).toBeNull()
    expect(document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`)).toBeNull()
  })

  it('returns null when fetch is unavailable', async () => {
    vi.stubGlobal('fetch', undefined)
    const overlay = await initCharacterOverlay()
    expect(overlay).toBeNull()
  })
})

describe('initCharacterOverlay — overlay DOM contract', () => {
  it('mounts div with data-jx-overlay=character on document.body', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    expect(overlay).not.toBeNull()
    const el = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`)
    expect(el).not.toBeNull()
    expect(el!.parentElement).toBe(document.body)
    overlay!.dispose()
  })

  it('container has no background (transparent无底)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    const el = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`) as HTMLElement
    expect(el.style.background).toBe('')
    expect(el.style.backgroundColor).toBe('')
    overlay!.dispose()
  })

  it('container has no box-shadow (无背光/无光晕)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    const el = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`) as HTMLElement
    expect(el.style.boxShadow).toBe('')
    overlay!.dispose()
  })

  it('container pointer-events: none (不拦截操作)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    const el = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`) as HTMLElement
    expect(el.style.pointerEvents).toBe('none')
    overlay!.dispose()
  })

  it('img has object-fit: contain (alpha 透明播放)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    const img = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"] img`) as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.style.objectFit).toBe('contain')
    overlay!.dispose()
  })

  it('img has no background and no box-shadow', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    const img = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"] img`) as HTMLImageElement
    expect(img.style.background).toBe('')
    expect(img.style.boxShadow).toBe('')
    overlay!.dispose()
  })

  it('dispose removes overlay from DOM', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    overlay!.dispose()
    expect(document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"]`)).toBeNull()
  })
})

describe('character overlay — setState', () => {
  it('setState to a new state does not throw (transition scheduling)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    expect(() => overlay!.setState('thinking')).not.toThrow()
    expect(() => overlay!.setState('replying')).not.toThrow()
    expect(() => overlay!.setState('idle')).not.toThrow()
    overlay!.dispose()
  })

  it('setState to same state is a no-op (no throw)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    expect(() => overlay!.setState('idle')).not.toThrow()
    overlay!.dispose()
  })

  it('setState with speech line shows bubble (no throw)', async () => {
    mockFetchOk()
    const overlay = await initCharacterOverlay()
    expect(() => overlay!.setState('welcome', '你好')).not.toThrow()
    overlay!.dispose()
  })
})

describe('character overlay — crossfade fallback for missing transition', () => {
  it('empty transition path falls back to crossfade (no throw)', async () => {
    mockFetchOk()
    // 强制 getTransitionPath 返回空 → crossfade 兜底
    const opts: CharacterOverlayOptions = {
      getTransitionPath: () => [] as TransitionSegment[],
    }
    const overlay = await initCharacterOverlay(opts)
    expect(overlay).not.toBeNull()
    expect(() => overlay!.setState('thinking')).not.toThrow()
    expect(() => overlay!.setState('error')).not.toThrow()
    overlay!.dispose()
  })

  it('partial transition (1 segment) plays without throw', async () => {
    mockFetchOk()
    const seg: TransitionSegment = {
      webp: 'transition-idle-thinking.webp',
      durationMs: 1000,
      key: 'idle->thinking',
    }
    const opts: CharacterOverlayOptions = {
      getTransitionPath: (_from: CharacterState, _to: CharacterState) => [seg],
    }
    const overlay = await initCharacterOverlay(opts)
    expect(() => overlay!.setState('thinking')).not.toThrow()
    overlay!.dispose()
  })
})

describe('PET_BASE — asset URL prefix', () => {
  it('PET_BASE is /pet/jiangxiao', () => {
    expect(PET_BASE).toBe('/pet/jiangxiao')
  })
})

describe('character overlay — img onerror falls back to idle', () => {
  it('img error event triggers setState(idle) (degrade on load failure)', async () => {
    mockFetchOk()
    // reduced-motion: crossfade 直接切图无动画，时序确定。
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    // 强制 crossfade 路径（无过渡段），切图同步可观察。
    const opts: CharacterOverlayOptions = { getTransitionPath: () => [] as TransitionSegment[] }
    const overlay = await initCharacterOverlay(opts)
    expect(overlay).not.toBeNull()
    // 切到非 idle 态，img.src 变 thinking.webp。
    overlay!.setState('thinking')
    const img = document.querySelector(`[${OVERLAY_ATTR}="${OVERLAY_VALUE}"] img`) as HTMLImageElement
    expect(img.src).toContain('thinking.webp')
    // 触发 img error 事件（模拟素材加载失败）。
    img.dispatchEvent(new Event('error'))
    // onerror 回调应调 setState('idle')，img.src 切回 idle.webp。
    expect(img.src).toContain('idle.webp')
    overlay!.dispose()
  })
})
