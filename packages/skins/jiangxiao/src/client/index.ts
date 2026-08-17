/**
 * Jiangxiao skin — Tang-style Ink-Dyed theme for the dsh web GUI.
 * apply() owns the whole surface and retracts it on dispose (the
 * ThemePresenter retraction discipline: the plugin only ever removes what it
 * wrote): the `data-dsh-jiangxiao` body attribute the stylesheet is scoped on
 * and the two inlined woff2 @font-face rules (Ma Shan Zheng kaiti + Noto Serif
 * SC song, with local() fallback chains). The CSS rides the bundle's
 * CSS-modules auto-inject (style tag owned by the loader, removed on entry
 * dispose). In addition the skin registers a first-level settings section
 * (skin settings card) that shows the animation-pack import guidance.
 *
 * Dark is the default scope (body[data-dsh-jiangxiao]); the light plum-blossom
 * variant overrides on body[data-dsh-jiangxiao]:not([data-ds-dark-theme]),
 * so the skin follows the DSH dark/light signal automatically with no JS.
 *
 * Chrome is trim: the skin injects no DOM chrome of its own. DSH's native
 * titlebar, statusbar, favicon and document title own the shell surface
 * unmodified. Jiangxiao only remaps tokens and beautifies existing DOM via
 * CSS (titlebar-v2 cloud pattern, gold scrollbar, Kaiti headings, gold
 * focus ring).
 */
import type { Context } from '@deepseek-ai/cordis'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import './jiangxiao.module.css'
import { JIANGXIAO_FONT_MASHANZHENG, JIANGXIAO_FONT_NOTOSERIFSC } from './art.ts'
import { NS, en, zh, type JiangxiaoKey } from './locales.ts'
import { SkinJiangxiaoSection } from './SkinSettingsCard.tsx'

/** Required services: slots (settings section), locale (i18n). */
export const inject = ['slots', 'locale']

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

/**
 * Apply the Jiangxiao skin: body attribute and inlined woff2 @font-face rules.
 * All writes are retracted by the effect disposer on dispose. The skin
 * injects no DOM chrome — DSH's native shell surface owns the titlebar,
 * statusbar, favicon and document title unmodified.
 * @param ctx - owning context (the effect lifecycle owns retraction).
 */
export function apply(ctx: ClientContext): void {
  const body = document.body
  body.dataset.dshJiangxiao = ''

  // Inject the @font-face rules for the two inlined woff2 fonts. Owned by
  // the effect disposer; removed on skin teardown so no stale @font-face
  // lingers to shadow a host font under the same family name.
  const fontStyle = document.createElement('style')
  fontStyle.dataset.skinChrome = 'fontface'
  fontStyle.textContent = fontFaceCss()
  document.head.append(fontStyle)

  ctx.effect(() => () => {
    delete body.dataset.dshJiangxiao
    fontStyle.remove()
  }, 'ui-skin-jiangxiao: Jiangxiao chrome')

  // Register locale dictionaries for the skin settings card.
  // Guarded behind ctx.get('locale') so the skin works in test environments
  // that create a plain Context without the locale service injected.
  const locale = ctx.get('locale')
  if (locale !== undefined) {
    ctx.effect(() => locale.register(NS, { zh, en }), 'ui-skin-jiangxiao: dictionaries')
  }

  // Register the first-level settings section (skin settings card) that
  // shows the animation-pack import guidance. Guarded by the slots service
  // availability for the same reason.
  const slots = ctx.get('slots')
  if (slots !== undefined) {
    slots.inject('settings.section', () => slots.register({
      name: 'settings.section',
      id: 'skin-jiangxiao',
      order: 125,
      label: () => locale!.bind('skinJiangxiao')('settings.title'),
      locale: 'skinJiangxiao',
      inject: () => ({}),
    }, SkinJiangxiaoSection))
  }
}
