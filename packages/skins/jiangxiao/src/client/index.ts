/**
 * Jiangxiao skin — Tang-style Ink-Dyed theme for the dsh web GUI.
 * apply() owns the whole surface and retracts it on dispose (the
 * ThemePresenter retraction discipline: the plugin only ever removes what it
 * wrote): the `data-dsh-jiangxiao` body attribute the stylesheet is scoped on,
 * the two inlined woff2 @font-face rules (Ma Shan Zheng kaiti + Noto Serif SC
 * song, with local() fallback chains), the title bar (cinnabar seal icon +
 * Tang title + window glyphs), the status bar (cinnabar dot + status cells),
 * the injected favicon, and the document title. The CSS rides the bundle's
 * CSS-modules auto-inject (style tag owned by the loader, removed on entry
 * dispose). No services are injected: the skin needs only the DOM.
 *
 * Dark is the default scope (body[data-dsh-jiangxiao]); the light plum-blossom
 * variant overrides on body[data-dsh-jiangxiao]:not([data-ds-dark-theme]),
 * so the skin follows the DSH dark/light signal automatically with no JS.
 *
 * Small config surface (pure presentation, no services): the pinned title
 * and the status cells can be overridden through localStorage keys
 * `dsh.jiangxiao.title` / `dsh.jiangxiao.cells` (JSON array of strings).
 * Reads are wrapped so a blocked/absent storage degrades to the defaults.
 */
import type { Context } from '@deepseek-ai/cordis'
import css from './jiangxiao.module.css'
import { JIANGXIAO_FONT_MASHANZHENG, JIANGXIAO_FONT_NOTOSERIFSC } from './art.ts'

/** The product title the skin pins (captured by the shell's DocumentTitle after settle). */
const SKIN_TITLE = '姜晓 · 墨染 · DeepSeek 在线'

/** Status bar cells; the spacer cell splits left and right groups. */
const STATUS_CELLS = ['墨染', '楷宋就绪', '已连接', '在线', '唐风正式版'] as const

/** Title bar window buttons (decorative glyphs, aria-hidden). */
const TITLEBAR_GLYPHS = ['-', '□', '×'] as const

/** localStorage keys for the optional title / status-cell overrides. */
const LS_TITLE = 'dsh.jiangxiao.title'
const LS_CELLS = 'dsh.jiangxiao.cells'

/** Bounds for localStorage overrides: keep the injected chrome small and
 *  bounded so a large or hostile override cannot stall apply(). */
const MAX_CELLS = 20
const MAX_CELL_LENGTH = 64
const MAX_TITLE_LENGTH = 200

/**
 * Resolve one module class name. The css-modules record types as
 * `string | undefined` under noUncheckedIndexedAccess; every key used here
 * is a literal name in this package's own stylesheet, so the fallback is
 * unreachable in practice and only satisfies the indexed-access type.
 */
const cls = (name: keyof typeof css): string => css[name] ?? ''

/** Cinnabar seal mark: a small ink-style seal glyph (a stylized "墨" radical
 *  hint rendered as a rounded square with a cream stroke), inline so the
 *  skin carries no static assets. The title bar wears the ink gradient, so
 *  the seal must read against it. */
const SEAL_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">',
  '<rect x="6" y="6" width="36" height="36" rx="6" fill="#c3272b" stroke="#a8382b" stroke-width="1.5"/>',
  '<path d="M16 16h16v4H16zm0 8h16v4H16zm0 8h10v4H16z" fill="#fff8ef"/>',
  '</svg>',
].join('')

/** Favicon: cinnabar seal roundel with a cream ink stroke — the Tang mark. */
const FAVICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">',
  '<rect x="4" y="4" width="56" height="56" rx="12" fill="#c3272b" stroke="#a8382b" stroke-width="2"/>',
  '<path d="M18 18h28v6H18zm0 12h28v6H18zm0 12h18v6H18z" fill="#fff8ef"/>',
  '</svg>',
].join('')

/** @font-face CSS text for the two inlined woff2 fonts. Each rule carries a
 *  local() fallback chain so a host with the font installed uses the local
 *  copy first, and the inlined woff2 only loads when the local font is
 *  absent (offline / fresh host). font-display: swap keeps text visible
 *  during the (rare) woff2 decode. */
function fontFaceCss(): string {
  return [
    `@font-face { font-family: "Ma Shan Zheng"; src: url(${JIANGXIAO_FONT_MASHANZHENG}) format("woff2"), local("Ma Shan Zheng"), local("Kaiti SC"), local("STKaiti"), local("KaiTi"), local("楷体"); font-style: normal; font-weight: 400; font-display: swap; }`,
    `@font-face { font-family: "Noto Serif SC"; src: url(${JIANGXIAO_FONT_NOTOSERIFSC}) format("woff2-variations"), url(${JIANGXIAO_FONT_NOTOSERIFSC}) format("woff2"), local("Noto Serif SC"), local("Songti SC"), local("SimSun"), local("宋体"); font-style: normal; font-weight: 200 900; font-display: swap; }`,
    `@font-face { font-family: "TangKai"; src: local("Kaiti SC"), local("STKaiti"), local("KaiTi"), local("楷体"), local("Noto Serif CJK SC"); font-weight: 400 700; }`,
  ].join('\n')
}

/** Read one optional localStorage override; returns undefined when storage
 *  is unavailable (private mode, file://, sandboxed iframe) or the key is
 *  absent. Never throws. */
function readOverride(key: string): string | undefined {
  try {
    return window.localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

/** Resolve the pinned title: localStorage `dsh.jiangxiao.title` wins when it
 *  is non-blank and within the length bound, else the default. */
function resolveTitle(): string {
  const override = readOverride(LS_TITLE)?.trim()
  if (override && override.length <= MAX_TITLE_LENGTH) return override
  return SKIN_TITLE
}

/** Resolve the status cells: localStorage `dsh.jiangxiao.cells` (JSON string
 *  array) wins when it parses to a bounded array of trimmed, non-blank
 *  strings, else the defaults. */
function resolveCells(): readonly string[] {
  const raw = readOverride(LS_CELLS)
  if (raw !== undefined) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= MAX_CELLS) {
        const cells: string[] = []
        for (const cell of parsed) {
          if (typeof cell !== 'string') return STATUS_CELLS
          const trimmed = cell.trim()
          if (trimmed === '' || trimmed.length > MAX_CELL_LENGTH) return STATUS_CELLS
          cells.push(trimmed)
        }
        if (cells.length > 0) return cells
      }
    } catch {
      // Fall through to the defaults on malformed JSON.
    }
  }
  return STATUS_CELLS
}

/**
 * Apply the Jiangxiao skin: body attribute, inlined woff2 @font-face rules,
 * title bar, status bar, favicon, title. All writes are retracted by the
 * effect disposer on dispose.
 * @param ctx - owning context (the effect lifecycle owns retraction).
 */
export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  const pinnedTitle = resolveTitle()
  body.dataset.dshJiangxiao = ''

  // Inject the @font-face rules for the two inlined woff2 fonts. Owned by
  // the effect disposer; removed on skin teardown so no stale @font-face
  // lingers to shadow a host font under the same family name.
  const fontStyle = document.createElement('style')
  fontStyle.dataset.skinChrome = 'fontface'
  fontStyle.textContent = fontFaceCss()
  document.head.append(fontStyle)

  const titlebar = document.createElement('div')
  titlebar.className = cls('jiangxiaoTitlebar')
  titlebar.dataset.skinChrome = 'titlebar'
  const seal = document.createElement('span')
  seal.className = cls('jiangxiaoTitlebarSeal')
  seal.innerHTML = SEAL_SVG
  const title = document.createElement('span')
  title.className = cls('jiangxiaoTitlebarTitle')
  title.textContent = pinnedTitle
  titlebar.append(seal, title)
  for (const glyph of TITLEBAR_GLYPHS) {
    const btn = document.createElement('span')
    btn.className = cls('jiangxiaoTitlebarBtn')
    btn.setAttribute('aria-hidden', 'true')
    btn.textContent = glyph
    titlebar.append(btn)
  }

  const statusbar = document.createElement('div')
  statusbar.className = cls('jiangxiaoStatusbar')
  statusbar.dataset.skinChrome = 'statusbar'
  const dot = document.createElement('span')
  dot.className = cls('jiangxiaoStatusbarSeal')
  const spacer = document.createElement('span')
  spacer.className = cls('jiangxiaoStatusbarSpacer')
  statusbar.append(dot, spacer)
  for (const cell of resolveCells()) {
    const el = document.createElement('span')
    el.className = cls('jiangxiaoStatusbarCell')
    el.dataset.skinCell = ''
    el.textContent = cell
    statusbar.append(el)
  }

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(FAVICON_SVG)}`
  document.head.append(favicon)

  document.title = pinnedTitle
  body.append(titlebar, statusbar)

  ctx.effect(() => () => {
    delete body.dataset.dshJiangxiao
    fontStyle.remove()
    titlebar.remove()
    statusbar.remove()
    favicon.remove()
    // Only restore when the skin's own title still stands — a session title
    // projected by the shell must not be clobbered by skin teardown.
    if (document.title === pinnedTitle) document.title = originalTitle
  }, 'ui-skin-jiangxiao: Jiangxiao chrome')
}