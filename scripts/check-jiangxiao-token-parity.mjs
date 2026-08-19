#!/usr/bin/env node
/**
 * check-jiangxiao-token-parity.mjs
 *
 * Compares --jx-* CSS custom property declarations between
 * the standalone dsh-web-ui-jx skin and the monorepo jiangxiao skin.
 *
 * Usage (from monorepo root):
 *   node scripts/check-jiangxiao-token-parity.mjs
 *
 * Exit codes:
 *   0 — all --jx-* tokens match
 *   1 — differences or missing tokens found
 *   2 — file-not-found / parse error
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(__dirname, '..');

// Standalone jx repo — sibling of the monorepo
const JX_STANDALONE = resolve(MONOREPO_ROOT, '..', 'dsh-web-ui-jx',
  'src', 'client', 'styles', 'jiangxiao.css');
const JX_MONOREPO = resolve(MONOREPO_ROOT,
  'packages', 'skins', 'jiangxiao', 'src', 'client', 'jiangxiao.module.css');

// ---------------------------------------------------------------------------
// Allowlist — known-intentional differences
// ---------------------------------------------------------------------------
//
// The standalone dsh-web-ui-jx skin and the monorepo jiangxiao skin are
// maintained in parallel but serve slightly different runtime environments.
// The differences below are INTENTIONAL and should NOT cause the parity
// check to fail. Any NEW difference (not in this list) is a real regression.
//
// ── Font family name mismatches (value mismatches) ──────────────────────
//
// The standalone skin ships its own @font-face declarations that register
// fonts under custom names (e.g. "JX MashanZheng"). The monorepo skin
// relies on the host app's font stack and uses the canonical Google Fonts
// / system names (e.g. "Ma Shan Zheng", "Noto Serif SC"). The font stacks
// therefore differ in family-name strings but resolve to the same glyphs
// at runtime.
//
// --jx-gold-foil differs only in explicit gradient-stop positions (0%/50%/
// 100% vs implicit evenly-spaced stops); the rendered gradient is identical.
//
const ALLOWED_VALUE_MISMATCHES = new Set([
  '--jx-font-display',   // "JX MashanZheng" vs 'Ma Shan Zheng'
  '--jx-font-ui',        // "JX NotoSerifSC" vs 'Noto Serif SC'
  '--jx-font-code',      // double-quoted vs single-quoted font stack
  '--jx-gold-foil',      // explicit vs implicit gradient stop positions
]);

// ── Monorepo-only tokens ────────────────────────────────────────────────
//
// These tokens are consumed by monorepo-specific UI components (syntax-
// highlighted agent/file badges, gold accent text) that do not exist in
// the standalone skin. They are defined in both dark and light themes.
//
const ALLOWED_MONOREPO_ONLY = new Set([
  '--jx-hl-agent',       // syntax-highlight colour for "agent" badges
  '--jx-hl-file',        // syntax-highlight colour for "file" badges
  '--jx-text-gold',      // gold accent text used in monorepo-only components
]);

// ---------------------------------------------------------------------------
// CSS helpers
// ---------------------------------------------------------------------------

/**
 * Extract the inner text of every CSS rule block whose selector matches `selectorRegex`.
 * Returns an array of block-content strings.
 *
 * Handles nested parentheses inside values (e.g. linear-gradient(...)) but
 * CSS declaration blocks never nest braces, so we just track { depth.
 */
function extractBlocks(css, selectorRegex) {
  const blocks = [];
  // Find each selector occurrence, then walk forward to grab the { ... } body.
  for (const m of css.matchAll(selectorRegex)) {
    const start = m.index + m[0].length;
    // Find the opening brace
    if (css[start] !== '{') continue;
    let depth = 1;
    let i = start + 1;
    for (; i < css.length && depth > 0; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') depth--;
    }
    blocks.push(css.slice(start + 1, i - 1));
  }
  return blocks;
}

/**
 * From a CSS block body, extract all --jx-* property declarations.
 * Returns a Map<string, string> of name -> value.
 *
 * Values may contain commas, parentheses, rgba(), linear-gradient(), etc.
 * We read until the terminating `;` that is NOT inside parentheses.
 */
function extractJxTokens(blockContent) {
  const tokens = new Map();
  // Match --jx-<name>: then capture value up to the ; that is at paren-depth 0
  const re = /(--jx-[\w-]+)\s*:\s*/g;
  let m;
  while ((m = re.exec(blockContent)) !== null) {
    const name = m[1];
    const valStart = m.index + m[0].length;
    let depth = 0;
    let valEnd = valStart;
    for (; valEnd < blockContent.length; valEnd++) {
      const ch = blockContent[valEnd];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ';' && depth === 0) break;
    }
    // Normalize: collapse inner whitespace, trim
    const value = blockContent.slice(valStart, valEnd)
      .replace(/\s+/g, ' ')
      .trim();
    tokens.set(name, value);
  }
  return tokens;
}

/**
 * Merge multiple token Maps (later blocks override earlier ones for the same key).
 */
function mergeTokens(...maps) {
  const merged = new Map();
  for (const m of maps) {
    for (const [k, v] of m) merged.set(k, v);
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

// Dark: body[data-dsh-jiangxiao] but NOT the :not([data-ds-dark-theme]) variant
const SEL_DARK = /body\[data-dsh-jiangxiao\](?!\:not)\s*/g;
// Light: body[data-dsh-jiangxiao]:not([data-ds-dark-theme])
const SEL_LIGHT = /body\[data-dsh-jiangxiao\]\:not\(\[data-ds-dark-theme\]\)\s*/g;

// ---------------------------------------------------------------------------
// Diff helpers
// ---------------------------------------------------------------------------

function diffTokens(labelA, tokensA, labelB, tokensB, themeLabel) {
  const allKeys = new Set([...tokensA.keys(), ...tokensB.keys()]);
  const sorted = [...allKeys].sort();

  const diffs = [];       // value mismatches
  const onlyA = [];       // only in A
  const onlyB = [];       // only in B

  for (const key of sorted) {
    const inA = tokensA.has(key);
    const inB = tokensB.has(key);
    if (inA && inB) {
      const vA = tokensA.get(key);
      const vB = tokensB.get(key);
      if (vA !== vB) {
        diffs.push({ key, vA, vB });
      }
    } else if (inA && !inB) {
      onlyA.push({ key, value: tokensA.get(key) });
    } else {
      onlyB.push({ key, value: tokensB.get(key) });
    }
  }

  return { diffs, onlyA, onlyB, labelA, labelB, themeLabel };
}

/**
 * Remove allowlisted items from a diff result.
 * Returns a new result object with the same shape, plus a `filtered` array
 * describing what was skipped (for logging).
 */
function filterAllowed(result) {
  const { diffs, onlyA, onlyB, labelB } = result;

  const filteredDiffs = diffs.filter(d => !ALLOWED_VALUE_MISMATCHES.has(d.key));
  const skippedDiffs = diffs.filter(d => ALLOWED_VALUE_MISMATCHES.has(d.key));

  // onlyA = tokens only in standalone; these are NEVER allowed (would mean
  // the monorepo is missing a token the standalone skin defines).
  const filteredOnlyA = onlyA;

  const filteredOnlyB = onlyB.filter(d => !ALLOWED_MONOREPO_ONLY.has(d.key));
  const skippedOnlyB = onlyB.filter(d => ALLOWED_MONOREPO_ONLY.has(d.key));

  const filtered = [];
  for (const d of skippedDiffs) {
    filtered.push(`  [allowed] value mismatch: ${d.key} (${labelB} uses a different font stack / gradient syntax)`);
  }
  for (const d of skippedOnlyB) {
    filtered.push(`  [allowed] ${labelB}-only token: ${d.key}`);
  }

  return {
    diffs: filteredDiffs,
    onlyA: filteredOnlyA,
    onlyB: filteredOnlyB,
    labelA: result.labelA,
    labelB: result.labelB,
    themeLabel: result.themeLabel,
    filtered,
  };
}

function printReport(result) {
  const { diffs, onlyA, onlyB, labelA, labelB, themeLabel } = result;
  const hasIssues = diffs.length + onlyA.length + onlyB.length;
  if (!hasIssues) {
    console.log(`  [${themeLabel}] All tokens match.`);
    return;
  }

  if (diffs.length) {
    console.log(`\n  [${themeLabel}] VALUE MISMATCHES (${diffs.length}):`);
    console.log('  ' + '-'.repeat(76));
    const hdr = `  ${'Token'.padEnd(30)} ${labelA.padEnd(22)} ${labelB}`;
    console.log(hdr);
    console.log('  ' + '-'.repeat(76));
    for (const { key, vA, vB } of diffs) {
      console.log(`  ${key.padEnd(30)} ${vA.padEnd(22)} ${vB}`);
    }
  }

  if (onlyA.length) {
    console.log(`\n  [${themeLabel}] ONLY IN ${labelA} (${onlyA.length}):`);
    for (const { key, value } of onlyA) {
      console.log(`  ${key.padEnd(30)} ${value}`);
    }
  }

  if (onlyB.length) {
    console.log(`\n  [${themeLabel}] ONLY IN ${labelB} (${onlyB.length}):`);
    for (const { key, value } of onlyB) {
      console.log(`  ${key.padEnd(30)} ${value}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Read files
  let cssStandalone, cssMonorepo;
  try {
    cssStandalone = readFileSync(JX_STANDALONE, 'utf8');
  } catch (err) {
    // CI runners and environments without the sibling dsh-web-ui-jx checkout
    // cannot run this comparison. Skip gracefully instead of failing red.
    if (err.code === 'ENOENT') {
      console.log(`SKIP: Standalone dsh-web-ui-jx not found at:\n  ${JX_STANDALONE}`);
      console.log('Parity check skipped — sibling repo not checked out alongside monorepo.');
      process.exit(0);
    }
    console.error(`ERROR: Cannot read standalone jiangxiao CSS:\n  ${JX_STANDALONE}\n  ${err.message}`);
    process.exit(2);
  }
  try {
    cssMonorepo = readFileSync(JX_MONOREPO, 'utf8');
  } catch (err) {
    console.error(`ERROR: Cannot read monorepo jiangxiao CSS:\n  ${JX_MONOREPO}\n  ${err.message}`);
    process.exit(2);
  }

  // Extract blocks
  const darkBlocksA = extractBlocks(cssStandalone, SEL_DARK);
  const lightBlocksA = extractBlocks(cssStandalone, SEL_LIGHT);
  const darkBlocksB = extractBlocks(cssMonorepo, SEL_DARK);
  const lightBlocksB = extractBlocks(cssMonorepo, SEL_LIGHT);

  if (!darkBlocksA.length) {
    console.error('WARNING: No dark-theme blocks found in standalone file.');
  }
  if (!darkBlocksB.length) {
    console.error('WARNING: No dark-theme blocks found in monorepo file.');
  }

  // Merge tokens across all matching blocks per theme per file
  const darkA = mergeTokens(...darkBlocksA.map(extractJxTokens));
  const lightA = mergeTokens(...lightBlocksA.map(extractJxTokens));
  const darkB = mergeTokens(...darkBlocksB.map(extractJxTokens));
  const lightB = mergeTokens(...lightBlocksB.map(extractJxTokens));

  const LABEL_A = 'dsh-web-ui-jx';
  const LABEL_B = 'monorepo';

  console.log('\n=== Jiangxiao Token Parity Report ===\n');
  console.log(`  Standalone : ${JX_STANDALONE}`);
  console.log(`  Monorepo   : ${JX_MONOREPO}`);
  console.log(`\n  Dark tokens  — ${LABEL_A}: ${darkA.size},  ${LABEL_B}: ${darkB.size}`);
  console.log(`  Light tokens — ${LABEL_A}: ${lightA.size},  ${LABEL_B}: ${lightB.size}`);

  // Diff dark
  const darkResult = filterAllowed(diffTokens(LABEL_A, darkA, LABEL_B, darkB, 'Dark'));
  // Diff light
  const lightResult = filterAllowed(diffTokens(LABEL_A, lightA, LABEL_B, lightB, 'Light'));

  // Log allowlisted items that were skipped
  const allFiltered = [...darkResult.filtered, ...lightResult.filtered];
  if (allFiltered.length) {
    console.log('\n  --- Allowlisted differences (skipped) ---');
    for (const line of allFiltered) console.log(line);
    console.log(`  (${allFiltered.length} known-intentional difference(s) skipped)\n`);
  }

  printReport(darkResult);
  printReport(lightResult);

  // Summary — only count un-filtered issues
  const totalIssues =
    darkResult.diffs.length + darkResult.onlyA.length + darkResult.onlyB.length +
    lightResult.diffs.length + lightResult.onlyA.length + lightResult.onlyB.length;

  console.log('');
  if (totalIssues === 0) {
    console.log('RESULT: All --jx-* tokens are in parity.');
    process.exit(0);
  } else {
    console.log(`RESULT: ${totalIssues} difference(s) found.`);
    process.exit(1);
  }
}

main();
