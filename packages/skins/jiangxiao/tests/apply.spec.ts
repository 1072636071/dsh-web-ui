// @vitest-environment jsdom
/**
 * Jiangxiao skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, the inlined woff2 @font-face style is injected and retracted,
 * and the skin injects no DOM chrome (no titlebar strip, no statusbar
 * strip, no favicon, no document.title override). DSH's native shell
 * surface owns the chrome unmodified.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.title = ''
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
    // The only data-skin-chrome node is the fontface style in <head>, never in <body>.
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
