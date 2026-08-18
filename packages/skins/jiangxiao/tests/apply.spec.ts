// @vitest-environment jsdom
/**
 * Jiangxiao skin apply spec — apply/dispose 契约 + 浮层契约 + CSS 炫技效果验证。
 *
 * 契约：body 属性设置/移除，woff2 @font-face 注入/移除，不注入 DOM chrome。
 * 浮层契约：未导入素材（fetch 404）→ 无浮层 DOM；导入后（fetch 200）→
 *   浮层标记存在（data-jx-overlay="character"）。
 * CSS：侧边栏背景用 surface 色阶（非屎黄色），@property 注册，keyframes 存在，
 * 银杏叶/梅花飘落 SVG，朱砂印章发送钮。
 *
 * 注：jsdom 环境下 import.meta.url 非 file: scheme，fileURLToPath(new URL(...))
 * 会抛 ERR_INVALID_URL_SCHEME。resolveAsset 用 try/catch 回退到 process.cwd()
 * （vitest cwd 即包根）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../src/client/index.ts'

/** 解析测试相对路径到绝对路径，兼容 node 与 jsdom 环境。 */
function resolveAsset(relativePath: string): string {
  try {
    return fileURLToPath(new URL(relativePath, import.meta.url))
  } catch {
    // jsdom 下 import.meta.url 非 file: scheme；回退到包根（vitest cwd）。
    return resolve(process.cwd(), relativePath.replace(/^(\.\.\/)+/, ''))
  }
}

const cssPath = resolveAsset('../src/client/jiangxiao.module.css')
const css = readFileSync(cssPath, 'utf8')

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

beforeEach(() => {
  // 默认 mock fetch 404（素材未导入），避免真实 HTTP 请求挂起。
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
})

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.title = ''
  vi.unstubAllGlobals()
})

describe('Jiangxiao skin apply', () => {
  it('sets the body attribute and retracts it on dispose', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-jiangxiao')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-jiangxiao')).toBe(false)
  })

  it('injects the woff2 @font-face style and retracts it on dispose', async () => {
    fiber = await mount()
    const fontFace = document.head.querySelector('style[data-skin-chrome="fontface"]')
    expect(fontFace).not.toBeNull()
    expect((fontFace as HTMLStyleElement).textContent).toContain('Ma Shan Zheng')
    expect((fontFace as HTMLStyleElement).textContent).toContain('Noto Serif SC')
    expect((fontFace as HTMLStyleElement).textContent).toContain('data:font/woff2;base64,')
    await fiber.dispose()
    expect(document.head.querySelector('style[data-skin-chrome="fontface"]')).toBeNull()
  })

  it('injects no DOM chrome elements (no titlebar, no statusbar)', async () => {
    fiber = await mount()
    expect(document.body.querySelector('[data-skin-chrome="titlebar"]')).toBeNull()
    expect(document.body.querySelector('[data-skin-chrome="statusbar"]')).toBeNull()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
    await fiber.dispose()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
  })

  it('does not override the document title', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('injects no favicon', async () => {
    fiber = await mount()
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull()
    await fiber.dispose()
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull()
  })
})

describe('Jiangxiao skin overlay contract — asset import gate', () => {
  it('no overlay DOM when assets not imported (fetch 404)', async () => {
    // fetch 已在 beforeEach mock 为 404
    fiber = await mount()
    // 等待浮层探测的 microtask/task 完成
    await new Promise((r) => setTimeout(r, 20))
    expect(document.querySelector('[data-jx-overlay="character"]')).toBeNull()
  })

  it('overlay present (data-jx-overlay) when assets imported (fetch 200)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    fiber = await mount()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-jx-overlay="character"]')).not.toBeNull()
    })
  })

  it('overlay retracted on dispose when assets imported', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    fiber = await mount()
    await vi.waitFor(() => {
      expect(document.querySelector('[data-jx-overlay="character"]')).not.toBeNull()
    })
    await fiber.dispose()
    expect(document.querySelector('[data-jx-overlay="character"]')).toBeNull()
  })
})

describe('Jiangxiao skin CSS — sidebar contrast fix', () => {
  it('sidebar-fill uses surface-1, not gold-deep or gold', () => {
    const fills = css.match(/--dsw-specific-sidebar-fill:\s*[^;]+;/g) ?? []
    expect(fills.length).toBeGreaterThanOrEqual(2)
    for (const fill of fills) {
      expect(fill).toContain('surface-1')
      expect(fill).not.toContain('gold')
    }
  })
})

describe('Jiangxiao skin CSS — @property animatable properties', () => {
  it('registers --jx-gold-angle for conic flow', () => {
    expect(css).toContain('@property --jx-gold-angle')
  })
  it('registers --jx-shimmer-x for gold-foil sweep', () => {
    expect(css).toContain('@property --jx-shimmer-x')
  })
  it('registers --jx-breathe for ink pulse', () => {
    expect(css).toContain('@property --jx-breathe')
  })
})

describe('Jiangxiao skin CSS — keyframes', () => {
  it('has jx-gold-rotate (liu-jin flow)', () => {
    expect(css).toContain('@keyframes jx-gold-rotate')
  })
  it('has jx-shimmer-sweep (gold-foil text)', () => {
    expect(css).toContain('@keyframes jx-shimmer-sweep')
  })
  it('has jx-leaf-fall (ginkgo leaves)', () => {
    expect(css).toContain('@keyframes jx-leaf-fall')
  })
  it('has jx-petal-fall (plum blossoms)', () => {
    expect(css).toContain('@keyframes jx-petal-fall')
  })
  it('has jx-ink-breathe (ink glow)', () => {
    expect(css).toContain('@keyframes jx-ink-breathe')
  })
  it('has jx-seal-pulse (cinnabar seal)', () => {
    expect(css).toContain('@keyframes jx-seal-pulse')
  })
})

describe('Jiangxiao skin CSS — falling SVG', () => {
  it('contains ginkgo leaf SVG (dark)', () => {
    expect(css).toContain("fill='%23d6b34a'")
    expect(css).toContain("fill='%23dfb793'")
  })
  it('contains plum blossom SVG (light)', () => {
    expect(css).toContain("fill='%23d97a8e'")
    expect(css).toContain("fill='%23e89aa8'")
  })
})

describe('Jiangxiao skin CSS — cinnabar seal send button', () => {
  it('styles prompt-submit as seal with pulse', () => {
    expect(css).toContain("[data-action='prompt-submit']")
    expect(css).toContain('jx-seal-pulse')
  })
  it('seal hover lifts and active presses', () => {
    expect(css).toContain('translateY(-1px)')
    expect(css).toContain('scale(0.96)')
  })
})
