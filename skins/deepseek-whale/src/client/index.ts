/**
 * deepseek-whale skin — the "DeepSeek-鲸鱼娘" Codex desktop theme
 * (dreamskin.cc, MIT, author powerdog996) adapted for the dsh web GUI, as a
 * hot-pluggable client plugin. apply() owns the whole ambient surface and
 * retracts it on dispose (the ThemePresenter retraction discipline: the
 * plugin only ever removes what it wrote): the `data-dsh-whale` body
 * attribute the stylesheet is scoped on, the whale-art backdrop (base64
 * data URL with a readability scrim chosen by the current theme, swapped
 * live on `data-ds-dark-theme` changes), and the injected whale favicon.
 * The palette remap and the frosted pane surfaces ride the bundle's
 * CSS-modules auto-inject (style tag owned by the loader, removed on entry
 * dispose). No services are injected: the skin needs only the DOM.
 */
import type { Context } from 'cordis'
import { WHALE_ART } from './art.ts'

/** Light scrim: a soft ice veil so text stays readable over the bright art. */
const SCRIM_LIGHT = [
  'linear-gradient(rgba(246, 248, 253, 0.5) 0%, rgba(240, 243, 251, 0.72) 55%, rgba(235, 239, 249, 0.8) 100%)',
].join(', ')

/** Dark scrim: a deep indigo veil, whale still visible underneath. */
const SCRIM_DARK = [
  'linear-gradient(rgba(10, 14, 28, 0.55) 0%, rgba(13, 18, 34, 0.7) 60%, rgba(16, 22, 42, 0.8) 100%)',
].join(', ')

/** The whale mark as favicon, inline so the skin carries no static assets. */
const WHALE_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">',
  '<circle cx="16" cy="16" r="16" fill="#4a5fa8"/>',
  '<path d="M5 19.5 Q5 13.5 12.5 13.5 L19.5 13.5 Q25 13.5 25.5 17.5 Q26 21.5 20.5 21.5 Q14 21.5 9.5 20.5 Q6.5 19.8 5 19.5 Z" fill="#ffffff"/>',
  '<path d="M25 15.5 L28.5 12.5 L27.5 17.5 L29 21.5 L25 19 Z" fill="#ffffff"/>',
  '<circle cx="9.5" cy="16.5" r="1.5" fill="#4a5fa8"/>',
  '<path d="M12.5 11 Q12.5 8.5 10.8 7.4 M12.5 11 Q12.5 8.5 14.2 7.4" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
  '</svg>',
].join('')

const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
] as const

/**
 * Apply the deepseek-whale skin: body attribute, whale-art backdrop (with a
 * live-swapping theme scrim), favicon. All writes are retracted by the
 * effect disposer on dispose. Backdrop writes go through the canonical
 * hyphenated CSSOM API (setProperty/getPropertyValue), so any prior value
 * round-trips verbatim on restore.
 * @param ctx - owning context (the effect lifecycle owns retraction).
 */
export function apply(ctx: Context): void {
  const body = document.body
  const previous = new Map<string, string>()
  for (const prop of BACKDROP_PROPERTIES) {
    previous.set(prop, body.style.getPropertyValue(prop))
  }
  body.dataset.dshWhale = ''

  const setBackdrop = (): void => {
    const dark = body.dataset.dsDarkTheme !== undefined
    body.style.setProperty('background-image', `${dark ? SCRIM_DARK : SCRIM_LIGHT}, url(${WHALE_ART})`)
    body.style.setProperty('background-position', 'center')
    body.style.setProperty('background-size', 'cover')
    body.style.setProperty('background-attachment', 'fixed')
    body.style.setProperty('background-repeat', 'no-repeat')
  }
  setBackdrop()

  // Swap the scrim live when the base theme system flips dark/light.
  const observer = new MutationObserver(setBackdrop)
  observer.observe(body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(WHALE_SVG)}`
  document.head.append(favicon)

  ctx.effect(() => () => {
    delete body.dataset.dshWhale
    observer.disconnect()
    for (const [prop, value] of previous) {
      body.style.setProperty(prop, value)
    }
    favicon.remove()
  }, 'ui-skin-deepseek-whale: whale backdrop')
}
