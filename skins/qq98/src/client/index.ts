/**
 * QQ98 skin — the first skin in the dsh web ui family, as a hot-pluggable
 * client plugin. apply() owns the whole retro surface and retracts it on
 * dispose (the ThemePresenter retraction discipline: the plugin only ever
 * removes what it wrote): the `data-dsh-retro` body attribute the
 * stylesheet is scoped on, the fixed title/status bars, the injected
 * favicon, and the document title the shell's DocumentTitle will capture
 * as the product title. The CSS rides the bundle's CSS-modules auto-inject
 * (style tag owned by the loader, removed on entry dispose). No services
 * are injected: the skin needs only the DOM.
 */
import type { Context } from 'cordis'
import css from './qq98.module.css'

/** The product title the skin pins (captured by the shell's DocumentTitle after settle). */
const SKIN_TITLE = 'OICQ · DeepSeek 在线'

/** Status bar cells; the spacer cell splits left and right groups. */
const STATUS_CELLS = ['QQ 10000', '就绪', '已连接', '在线', 'OICQ 1998 · 怀旧版'] as const

/** Title bar window buttons (decorative glyphs, aria-hidden). */
const TITLEBAR_GLYPHS = ['–', '□', '✕'] as const

/**
 * Resolve one module class name. The css-modules record types as
 * `string | undefined` under noUncheckedIndexedAccess; every key used here
 * is a literal name in this package's own stylesheet, so the fallback is
 * unreachable in practice and only satisfies the indexed-access type.
 */
const cls = (name: keyof typeof css): string => css[name] ?? ''

/** OICQ-era penguin mark, inline so the skin carries no static assets. */
const PENGUIN_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">',
  '<ellipse cx="24" cy="27" rx="15" ry="18" fill="#1a1a2e"/>',
  '<ellipse cx="24" cy="31" rx="9" ry="13" fill="#f5f5f5"/>',
  '<ellipse cx="24" cy="12" rx="12" ry="11" fill="#1a1a2e"/>',
  '<ellipse cx="24" cy="14" rx="8" ry="6.5" fill="#f5f5f5"/>',
  '<circle cx="20" cy="12" r="2.2" fill="#fff"/><circle cx="20" cy="12" r="1.1" fill="#000"/>',
  '<circle cx="28" cy="12" r="2.2" fill="#fff"/><circle cx="28" cy="12" r="1.1" fill="#000"/>',
  '<polygon points="24,15 21,18 24,20 27,18" fill="#ff8c00"/>',
  '<ellipse cx="10.5" cy="26" rx="3.5" ry="9" fill="#1a1a2e" transform="rotate(12 10.5 26)"/>',
  '<ellipse cx="37.5" cy="26" rx="3.5" ry="9" fill="#1a1a2e" transform="rotate(-12 37.5 26)"/>',
  '<ellipse cx="19" cy="45" rx="5" ry="2.6" fill="#ff8c00"/>',
  '<ellipse cx="29" cy="45" rx="5" ry="2.6" fill="#ff8c00"/>',
  '</svg>',
].join('')

/**
 * Apply the QQ98 skin: body attribute, chrome bars, title, favicon. All
 * writes are retracted by the effect disposer on dispose.
 * @param ctx - owning context (the effect lifecycle owns retraction).
 */
export function apply(ctx: Context): void {
  const body = document.body
  const originalTitle = document.title
  body.dataset.dshRetro = ''

  const titlebar = document.createElement('div')
  titlebar.className = cls('retroTitlebar')
  const icon = document.createElement('span')
  icon.className = cls('retroTitlebarIcon')
  icon.innerHTML = PENGUIN_SVG
  const title = document.createElement('span')
  title.className = cls('retroTitlebarTitle')
  title.textContent = SKIN_TITLE
  titlebar.append(icon, title)
  for (const glyph of TITLEBAR_GLYPHS) {
    const btn = document.createElement('span')
    btn.className = cls('retroTitlebarBtn')
    btn.setAttribute('aria-hidden', 'true')
    btn.textContent = glyph
    titlebar.append(btn)
  }

  const statusbar = document.createElement('div')
  statusbar.className = cls('retroStatusbar')
  const spacer = document.createElement('span')
  spacer.className = cls('retroStatusbarSpacer')
  statusbar.append(spacer)
  for (const cell of STATUS_CELLS) {
    const el = document.createElement('span')
    el.className = cls('retroStatusbarCell')
    el.textContent = cell
    statusbar.append(el)
  }

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(PENGUIN_SVG)}`
  document.head.append(favicon)

  document.title = SKIN_TITLE
  body.append(titlebar, statusbar)

  ctx.effect(() => () => {
    delete body.dataset.dshRetro
    titlebar.remove()
    statusbar.remove()
    favicon.remove()
    // Only restore when the skin's own title still stands — a session title
    // projected by the shell must not be clobbered by skin teardown.
    if (document.title === SKIN_TITLE) document.title = originalTitle
  }, 'ui-skin-qq98: retro chrome')
}
