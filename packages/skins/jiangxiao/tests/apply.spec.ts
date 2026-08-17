// @vitest-environment jsdom
/**
 * Jiangxiao skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, every injected chrome element (marked data-skin-chrome) is
 * removed, the inlined woff2 @font-face style is injected and retracted,
 * and the favicon/title are pinned and restored.
 *
 * Node >= 22.4 ships a native global localStorage that Vitest 4's jsdom
 * environment does not replace, so the tests stub a deterministic in-memory
 * implementation instead of relying on the environment's storage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined

/** A deterministic in-memory Storage, safe on every supported Node version. */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  const storage = {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  } as Storage
  return storage
}

/** The default status-cell count (see STATUS_CELLS in src/client/index.ts). */
const DEFAULT_CELL_COUNT = 5

/** Collect the injected status cells via their stable data marker. */
function cellsOf(): Element[] {
  const statusbar = document.querySelector('[data-skin-chrome="statusbar"]')
  return Array.from(statusbar?.querySelectorAll('[data-skin-cell]') ?? [])
}

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
  document.body.removeAttribute('style')
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

  it('injects chrome and retracts every element on dispose', async () => {
    fiber = await mount()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBeGreaterThan(0)
    await fiber.dispose()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
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

  it('pins the skin title and restores the original on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).not.toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('injects the cinnabar favicon and retracts it on dispose', async () => {
    fiber = await mount()
    const fav = document.head.querySelector('link[rel="icon"]')
    expect(fav).not.toBeNull()
    expect((fav as HTMLLinkElement).href).toContain('image/svg+xml')
    await fiber.dispose()
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull()
  })

  it('honours the localStorage title override', async () => {
    window.localStorage.setItem('dsh.jiangxiao.title', '姜晓定制标题')
    fiber = await mount()
    expect(document.title).toBe('姜晓定制标题')
    expect(document.querySelector('[data-skin-chrome="titlebar"]')?.textContent).toContain('姜晓定制标题')
  })

  it('falls back to the default title when the override is over-long', async () => {
    window.localStorage.setItem('dsh.jiangxiao.title', 'x'.repeat(201))
    fiber = await mount()
    expect(document.title).toContain('DeepSeek')
  })

  it('honours the localStorage status-cell override', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['墨染', '唐风']))
    fiber = await mount()
    const cells = cellsOf()
    expect(cells.length).toBe(2)
    expect(cells[0]?.textContent).toBe('墨染')
    expect(cells[1]?.textContent).toBe('唐风')
  })

  it('ignores a malformed status-cell override', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', 'not-json')
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('ignores a non-array status-cell override', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify({ live: '01' }))
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('ignores an empty status-cell array', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', '[]')
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('rejects a status-cell override containing blank cells', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['   ', 'x']))
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('rejects an oversized status-cell override', async () => {
    window.localStorage.setItem(
      'dsh.jiangxiao.cells',
      JSON.stringify(Array.from({ length: 21 }, (_, i) => `cell ${i}`)),
    )
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('rejects an over-long status cell', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['x'.repeat(65)]))
    fiber = await mount()
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
  })

  it('trims whitespace from status cells', async () => {
    window.localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['  墨染  ', '唐风']))
    fiber = await mount()
    const cells = cellsOf()
    expect(cells.length).toBe(2)
    expect(cells[0]?.textContent).toBe('墨染')
  })

  it('degrades to the defaults when localStorage access throws', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('storage blocked')
      },
    } as unknown as Storage)
    fiber = await mount()
    expect(document.title).toContain('DeepSeek')
    expect(cellsOf().length).toBe(DEFAULT_CELL_COUNT)
    expect(document.body.hasAttribute('data-dsh-jiangxiao')).toBe(true)
  })
})