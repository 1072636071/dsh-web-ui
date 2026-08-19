/**
 * Jiangxiao skin WCAG contrast gate — a zero-dependency pure-Node script that
 * parses the --jx-text-* / --jx-surface-* token literals from
 * jiangxiao.module.css (dark + light variants) and asserts every text token
 * meets WCAG 2.1 AA on every surface. Runs standalone (exit 0/1) and is
 * wrapped by check-jiangxiao-contrast.test.mjs for `pnpm test:scripts`.
 *
 * Usage: node scripts/check-jiangxiao-contrast.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = join(SCRIPT_DIR, '..')
const CSS_PATH = join(ROOT, 'packages/skins/jiangxiao/src/client/jiangxiao.module.css')

// --- WCAG 2.1 contrast math ---------------------------------------------------

/** Parse #rrggbb (or #rgb) to [r, g, b] (0-255). */
function parseHex(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** sRGB channel to linear light. */
function channelLinear(c) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** Relative luminance of a #rrggbb color. */
function luminance(hex) {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * channelLinear(r) + 0.7152 * channelLinear(g) + 0.0722 * channelLinear(b)
}

/** WCAG 2.1 contrast ratio between two #rrggbb colors. */
function contrast(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// --- CSS parsing --------------------------------------------------------------

/** Extract the first block body for a given selector prefix. */
function extractBlock(css, selectorPrefix) {
  const re = new RegExp(selectorPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([\\s\\S]*?)\\}')
  const m = css.match(re)
  return m ? m[1] : ''
}

/** Extract --jx-*: #hex declarations from a block body. */
function extractHexVars(block) {
  const vars = {}
  const re = /(--jx-[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g
  let m
  while ((m = re.exec(block)) !== null) {
    vars[m[1]] = m[2]
  }
  return vars
}

// --- Gate logic ---------------------------------------------------------------

const TEXT_TOKENS_AA = {
  dark: ['--jx-text-strong', '--jx-text-base', '--jx-gold'],
  light: ['--jx-text-strong', '--jx-text-base', '--jx-gold-dim'],
}
const TEXT_TOKENS_3 = ['--jx-text-weak', '--jx-text-faint']
const SURFACES = ['--jx-surface-0', '--jx-surface-1', '--jx-surface-2', '--jx-surface-3']

/** Run the contrast gate; returns an array of failure objects (empty = pass). */
function runGate() {
  const css = readFileSync(CSS_PATH, 'utf8')
  const failures = []

  for (const [label, selector] of [
    ['dark', 'body[data-dsh-jiangxiao]'],
    ['light', 'body[data-dsh-jiangxiao]:not([data-ds-dark-theme])'],
  ]) {
    const block = extractBlock(css, selector)
    const vars = extractHexVars(block)
    const aaTokens = TEXT_TOKENS_AA[label]

    for (const tk of [...aaTokens, ...TEXT_TOKENS_3]) {
      if (!(tk in vars)) {
        failures.push({ variant: label, token: tk, surface: '-', ratio: 0, target: 0, reason: 'token not found in CSS' })
        continue
      }
    }
    for (const sf of SURFACES) {
      if (!(sf in vars)) {
        failures.push({ variant: label, token: '-', surface: sf, ratio: 0, target: 0, reason: 'surface not found in CSS' })
      }
    }

    for (const tk of aaTokens) {
      if (!(tk in vars)) continue
      for (const sf of SURFACES) {
        if (!(sf in vars)) continue
        const ratio = contrast(vars[tk], vars[sf])
        if (ratio < 4.5) {
          failures.push({ variant: label, token: tk, surface: sf, ratio, target: 4.5, textVal: vars[tk], surfaceVal: vars[sf] })
        }
      }
    }
    for (const tk of TEXT_TOKENS_3) {
      if (!(tk in vars)) continue
      for (const sf of SURFACES) {
        if (!(sf in vars)) continue
        const ratio = contrast(vars[tk], vars[sf])
        if (ratio < 3) {
          failures.push({ variant: label, token: tk, surface: sf, ratio, target: 3, textVal: vars[tk], surfaceVal: vars[sf] })
        }
      }
    }
  }

  return failures
}

const failures = runGate()

if (failures.length === 0) {
  console.log('jiangxiao contrast gate: all text tokens meet WCAG AA on every surface (dark + light)')
  process.exit(0)
} else {
  console.error(`jiangxiao contrast gate: ${failures.length} failure(s)`)
  for (const f of failures) {
    if (f.reason) {
      console.error(`  FAIL  [${f.variant}] ${f.token} on ${f.surface}: ${f.reason}`)
    } else {
      console.error(
        `  FAIL  [${f.variant}] ${f.token} (${f.textVal}) on ${f.surface} (${f.surfaceVal}): `
        + `${f.ratio.toFixed(2)} < ${f.target}`,
      )
    }
  }
  process.exit(1)
}