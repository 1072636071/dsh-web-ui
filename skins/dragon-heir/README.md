# @deepseek-ai/dsh-client-ui-skin-dragon-heir

龙的传人 (Dragon Heir) skin for the dsh web GUI — one skin, two paintings:
light theme rides 不屈龙魂 (Unyielding Dragon Soul — an ink dragon, vermilion
朱砂 seal), dark theme rides 万里长城 (The Great Wall — ink-blue mountains at
dusk, dawn-gold 鎏金 accents). Both artworks and both seal favicons are inline
data URLs, so the skin ships no static files.

Hot-pluggable as a client plugin in the official standalone bundle shape:
`apply()` sets the `data-dsh-dragon-heir` body attribute (the scope of the whole
stylesheet), mounts the themed dragon backdrop with a readability scrim and the
themed 龙-seal favicon — swapping art, scrim and seal live when the base theme
system flips `data-ds-dark-theme` — and its effect disposer retracts every
write, restoring any prior backdrop verbatim. The stylesheet rides the bundle's
CSS-modules auto-inject, so the loader removes it with the entry.

The skin is presentation-only: no services are injected, no cordis events are
emitted, and nothing reaches a model request.

## Installing (official bundle)

1. Local path: `dsh plugin --profile <name> add /path/to/dsh-web-ui/skins/dragon-heir`
2. Git: `dsh plugin --profile <name> add github:<org>/dsh-web-ui#<sha>` —
   pnpm ≥10 asks once for `allowBuilds` authorization (the `prepare` script
   self-containedly builds `lib/`; no monorepo reference needed).
3. Switch with `scripts/dsh-skin` (`dsh-skin use dragon-heir`); only one skin is
   ever active at a time.

## Building and testing

```sh
pnpm build   # tsdown: lib/index.js + lib/client.js (self-contained preset)
pnpm test    # vitest: apply/dispose contract spec (dual-theme art swap)
```

## Publishing to the skin center

```sh
node scripts/skin-center-bundles    # re-embed this skin into skin-center's registry
pnpm --filter @deepseek-ai/dsh-client-ui-skin-center build
node scripts/gallery-build          # refresh the gallery manifest/bundles
node scripts/capture-previews       # re-shoot preview/light.png + preview/dark.png
```

Then commit everything (lib/, preview/, regenerated registry/gallery) and open a PR.

## Artwork swap

The two artworks live in `src/client/art.ts` (`LIGHT_ART` / `DARK_ART`) as data
URLs; the original generated PNGs are kept in `artwork/` (repo source only,
not shipped in the bundle). To swap in new artwork, use the embed script — it
compresses to WebP (≈1600px wide, quality 75, ≤800 KiB) via headless Chromium
and splices the base64 straight into the constant:

```sh
node scripts/embed-skin-art dragon-heir LIGHT_ART /path/to/ink-dragon.png
node scripts/embed-skin-art dragon-heir DARK_ART /path/to/gold-dragon.png
```

Then `pnpm build`, `node scripts/capture-previews dragon-heir`, and re-run the
skin-center/gallery regeneration. The seal favicons (`LIGHT_ICON` / `DARK_ICON`)
are self-contained SVGs and never need replacing.
