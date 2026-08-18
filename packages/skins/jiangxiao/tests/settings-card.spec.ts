// @vitest-environment jsdom
/**
 * 工单 07：设置卡导入引导 + welcome 触发单测。
 *
 * probeAssetReady：素材就绪检测两态（200=就绪，404/错误=未导入）。
 * resolveSkinCardView：设置卡「素材导入引导区」视图分支判定（checking/ready/not-ready）。
 * FX 五效开关独立于素材导入状态，任何视图下均渲染（由 FxToggles 组件负责，此文件不测其渲染）。
 * welcome 触发：模块级 flag 保证每次启用至多一次（通过 initialWelcome 选项
 * 在 character-follow.spec.ts 已测，此处只测 probeAssetReady 外部行为）。
 *
 * 只测外部行为，不测组件渲染细节。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { probeAssetReady, PET_BASE } from '../src/client/character-overlay.ts'
import { resolveSkinCardView } from '../src/client/SkinSettingsCard.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('probeAssetReady - asset ready detection', () => {
  it('HEAD /pet/jiangxiao/idle.webp 200 -> true (ready)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    expect(await probeAssetReady()).toBe(true)
  })

  it('HEAD 404 -> false (not imported)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    expect(await probeAssetReady()).toBe(false)
  })

  it('network error -> false (not imported, no throw)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    expect(await probeAssetReady()).toBe(false)
  })

  it('fetch unavailable -> false (no throw)', async () => {
    vi.stubGlobal('fetch', undefined)
    expect(await probeAssetReady()).toBe(false)
  })

  it('uses HEAD method', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)
    await probeAssetReady()
    expect(fetchMock).toHaveBeenCalledWith(`${PET_BASE}/idle.webp`, { method: 'HEAD' })
  })
})

describe('resolveSkinCardView - settings card view branching', () => {
  it('checking=true -> checking (regardless of petImported)', () => {
    expect(resolveSkinCardView(true, null)).toBe('checking')
    expect(resolveSkinCardView(true, true)).toBe('checking')
    expect(resolveSkinCardView(true, false)).toBe('checking')
  })
  it('checking=false, petImported=true -> ready (show activated + FX toggles)', () => {
    expect(resolveSkinCardView(false, true)).toBe('ready')
  })
  it('checking=false, petImported=false -> not-ready (show import guidance)', () => {
    expect(resolveSkinCardView(false, false)).toBe('not-ready')
  })
  it('checking=false, petImported=null -> not-ready (probe failed, guidance)', () => {
    expect(resolveSkinCardView(false, null)).toBe('not-ready')
  })
  it('ready and not-ready are mutually exclusive', () => {
    const ready = resolveSkinCardView(false, true)
    const notReady = resolveSkinCardView(false, false)
    expect(ready).toBe('ready')
    expect(notReady).toBe('not-ready')
    expect(ready).not.toBe(notReady)
  })
})
