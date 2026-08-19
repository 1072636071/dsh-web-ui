/**
 * 工单 02：令牌与 remap 完整性校验。
 *
 * 验证 .scratch/skin-preview/tokens.css 令牌表每个令牌暗浅双值齐全，
 * remap 原则合规，无纯 #fff/#000，皮肤作用域正确。
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cssPath = fileURLToPath(new URL('../src/client/jiangxiao.module.css', import.meta.url))
const css = readFileSync(cssPath, 'utf8')

/**
 * 提取所有选择器块中定义的 --jx-* 令牌名。
 * dark: body[data-dsh-jiangxiao] 但不含 :not([data-ds-dark-theme])
 * light: body[data-dsh-jiangxiao]:not([data-ds-dark-theme])
 */
function extractJxTokens(scope: 'dark' | 'light'): Set<string> {
  const tokens = new Set<string>()
  // 匹配 body[data-dsh-jiangxiao] 开头的规则块（非嵌套大括号）
  const selectorPattern =
    scope === 'dark'
      ? /body\[data-dsh-jiangxiao\](?!\[?:not\])[^{}]*\{([^}]*)\}/g
      : /body\[data-dsh-jiangxiao\]:not\(\[data-ds-dark-theme\]\)[^{}]*\{([^}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = selectorPattern.exec(css)) !== null) {
    const body = m[1]!
    const tokenPattern = /(--jx-[a-z0-9-]+)\s*:/g
    let t: RegExpExecArray | null
    while ((t = tokenPattern.exec(body)) !== null) {
      tokens.add(t[1]!)
    }
  }
  return tokens
}

const darkTokens = extractJxTokens('dark')
const lightTokens = extractJxTokens('light')

/** .scratch/skin-preview/tokens.css 定义的必需令牌（暗浅双值齐全）。 */
const REQUIRED_TOKENS = [
  // Surface
  '--jx-surface-0', '--jx-surface-1', '--jx-surface-2', '--jx-surface-3',
  // Text
  '--jx-text-strong', '--jx-text-base', '--jx-text-weak', '--jx-text-faint',
  // Gold
  '--jx-gold-bright', '--jx-gold', '--jx-gold-deep', '--jx-gold-dim', '--jx-ginkgo',
  // Seal + Cinnabar
  '--jx-seal', '--jx-seal-deep', '--jx-seal-bright', '--jx-seal-ink', '--jx-cinnabar',
  // Atmosphere
  '--jx-border-deco', '--jx-ink-glow',
  // Scrollbar
  '--jx-scroll-track', '--jx-scroll-thumb',
  // Code syntax
  '--jx-code-bg', '--jx-code-border', '--jx-kw', '--jx-str', '--jx-fn', '--jx-cmt', '--jx-num',
  // Decorative fall + poem
  '--jx-petal-1', '--jx-petal-2', '--jx-petal-3', '--jx-poem-color',
  // Typography
  '--jx-font-display', '--jx-font-ui', '--jx-font-code',
  // Motion durations
  '--jx-dur-fast', '--jx-dur', '--jx-breathe', '--jx-gold-rotate', '--jx-shimmer',
  '--jx-leaf-fall-min', '--jx-leaf-fall-max', '--jx-seal-pulse', '--jx-bpulse',
  // Radius
  '--jx-radius-sm', '--jx-radius-md', '--jx-radius-lg', '--jx-radius-xl', '--jx-radius-seal',
  // Shadow
  '--jx-shadow-1', '--jx-shadow-2', '--jx-gold-rim',
  // Layout
  '--jx-sidebar-w', '--jx-files-w',
  // 渐变
  '--jx-gold-foil',
] as const

describe('tokens.css — token dark/light dual values complete', () => {
  for (const token of REQUIRED_TOKENS) {
    it(`${token} defined in dark scope`, () => {
      expect(darkTokens.has(token)).toBe(true)
    })
    it(`${token} defined in light scope`, () => {
      expect(lightTokens.has(token)).toBe(true)
    })
  }
})

describe('auxiliary tokens — DSH remap 必需但 tokens.css 未定义（唐风派生，暗浅双值）', () => {
  const auxTokens = [
    '--jx-success', '--jx-warn', '--jx-error',
    '--jx-success-soft', '--jx-warn-soft', '--jx-error-soft',
    '--jx-selection',
  ] as const
  for (const token of auxTokens) {
    it(`${token} defined in dark scope`, () => {
      expect(darkTokens.has(token)).toBe(true)
    })
    it(`${token} defined in light scope`, () => {
      expect(lightTokens.has(token)).toBe(true)
    })
  }
})

describe('remap principle — alias/specific point to --jx-* (no color literals)', () => {
  // alias/specific/aion 层不应有裸 hex 字面量，应全部 var(--jx-*)
  // 提取所有 --dsw-alias-* / --dsw-specific-* / --aion-* 声明行
  const aliasLines = css
    .split('\n')
    .filter((l) => l.trim().startsWith('--dsw-alias-') || l.trim().startsWith('--dsw-specific-') || l.trim().startsWith('--aion-'))

  it('alias/specific/aion declarations exist', () => {
    expect(aliasLines.length).toBeGreaterThan(50)
  })

  // 允许的例外：rgba() 用于 mask/overlay/shadow（非纯色，是 alpha 混合）
  // 纯 hex 字面量（#xxxxxx）在 alias 层是违规的
  const hexLiteralLines = aliasLines.filter((l) => /#[0-9a-fA-F]{3,8};/.test(l))
  it('no hex color literals in alias/specific/aion layer', () => {
    expect(hexLiteralLines).toEqual([])
  })
})

describe('no pure #fff / #000', () => {
  it('no pure #fff or #000 anywhere in CSS', () => {
    // 允许 #fff8ef / #fff8f6（带色调的 seal-ink），不允许纯 #fff / #000
    const pureWhite = /\b#fff\b/i.test(css)
    const pureBlack = /\b#000\b/i.test(css)
    expect(pureWhite).toBe(false)
    expect(pureBlack).toBe(false)
  })
})

describe('skin scope — body[data-dsh-jiangxiao] with :not([data-ds-dark-theme]) for light', () => {
  it('dark scope uses body[data-dsh-jiangxiao]', () => {
    expect(css).toContain('body[data-dsh-jiangxiao]')
  })
  it('light scope uses body[data-dsh-jiangxiao]:not([data-ds-dark-theme])', () => {
    expect(css).toContain('body[data-dsh-jiangxiao]:not([data-ds-dark-theme])')
  })
})

describe('gradient — only --jx-gold-foil and atmosphere gradients', () => {
  // 唯一渐变令牌是 --jx-gold-foil；氛围渐变用 radial-gradient/linear-gradient
  it('defines --jx-gold-foil in dark scope', () => {
    expect(css).toContain('--jx-gold-foil: linear-gradient(135deg')
  })
  it('defines --jx-gold-foil in light scope', () => {
    // 浅色 gold-foil 有不同色值
    const lightFoil = /body\[data-dsh-jiangxiao\]:not\(\[data-ds-dark-theme\]\)[^{]*\{[^}]*--jx-gold-foil:\s*linear-gradient/
    expect(lightFoil.test(css)).toBe(true)
  })
})

describe('component layer (skin-card.module.css) — L3 rules', () => {
  // 组件层：无主题选择器（body[data-dsh-jiangxiao]），颜色用 var(--jx-*) 带 fallback
  const cardCssPath = fileURLToPath(new URL('../src/client/skin-card.module.css', import.meta.url))
  const cardCss = readFileSync(cardCssPath, 'utf8')

  it('no theme selector in component layer', () => {
    expect(cardCss).not.toContain('body[data-dsh-jiangxiao]')
    expect(cardCss).not.toContain('data-ds-dark-theme')
  })
  it('uses var(--jx-*) for colors (with fallback allowed)', () => {
    // 主值应是 var(--jx-*)，fallback hex 在 var() 内是允许的
    expect(cardCss).toContain('var(--jx-')
  })
  it('no bare hex color literals outside var() fallback', () => {
    // 提取 var() 外的裸 hex（属性值直接是 hex 而非 var()）
    const lines = cardCss.split('\n').filter((l) => l.trim() && !l.trim().startsWith('/*') && !l.trim().startsWith('//'))
    const bareHex = lines.filter((l) => /:\s*#[0-9a-fA-F]{3,8};/.test(l))
    expect(bareHex).toEqual([])
  })
})
