# dsh-client-ui-skin-jiangxiao · Jiangxiao Ink-Gold Scroll theme skin

English | [中文](README.zh.md)

A Tang-style anime theme skin for the DeepSeek Harness (DSH) Web GUI: dark "Ink-Gold Scroll Ginkgo" + light "Xuan-Paper Plum Blossom" dual themes, designed to the repo's `skin-preview` prototype. Beyond the pure-presentation token remap, the skin ships a runtime layer: an FX toggle system, a character overlay with a gold glow backlight, DSH session-state follow, and an asset-import guide in the settings card.

- **Palette**: ink-black ground, gilt flow, ginkgo fall, cinnabar seal (dark default "Ink-Gold Scroll Ginkgo"); rice-white xuan-paper ground, ink wash, plum blossom fall (light variant "Xuan-Paper Plum Blossom")
- **Dual theme**: dark is the default; light follows the DSH dark/light signal automatically (`body[data-ds-dark-theme]`)
- **Token-level port**: `--jx-*` tokens follow the skin-preview token table (surface / text / gold / seal / cinnabar / ink-glow / code syntax / petal / motion / radius / shadow / layout), remapped onto the dsh three-layer token system (`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`), so every component lands in the Tang-ink era. Gold-as-text uses `--jx-gold` (dark) / `--jx-gold-dim` (light), both AA on every surface.
- **Decorative layer**: gold-foil h1-h4 (`background-clip: text` with `@supports` fallback to solid AA gold), titlebar-v2 Tang-cloud ornament + gilt flow, gold scrollbar, ::selection, strong/b bright gold, :focus-visible outline, Tang-framed code blocks (`--jx-code-bg` / `--jx-code-border`). No chrome bars, no favicon, no document.title override, no button/input hardcode.
- **Fonts**: two woff2 fonts inlined (Ma Shan Zheng kaiti + Noto Serif SC song), offline-capable, `@font-face` carries `local()` fallback chains
- **Syntax highlighting**: syntax span colors stay the upstream shiki palette (inline styles); the skin dresses the code block chrome only

![Light](preview/light.png) · ![Dark](preview/dark.png)

## Features

- Pure presentation layer plus a guarded runtime layer: the skin injects no services of its own, only consumes `slots` / `locale` / `sessions` when present
- `apply()` only writes what it withdraws; the disposer fully recovers (body attribute, @font-face style, FX classes, overlay DOM, session subscriptions)
- All styles hang under `body[data-dsh-jiangxiao]` (light variant `:not([data-ds-dark-theme])`)
- No static asset files for fonts: fonts are embedded as base64 data URLs in the JS bundle
- `prefers-reduced-motion` disables all motion and forces the FX system off
- **FX toggle system**: five independent effects (shimmer gilt top bar + gold-foil text / fall ginkgo-plum fall with 8 independent pieces / grain static ink texture / breathe ink-glow breathing / micro seal pulse + hover micro-interactions) controlled via `html.fx-*` classes and persisted in `localStorage('jx-fx')`. Default all-on; each can be toggled independently; all-off equals the original skin with zero visual delta. The settings card exposes the switches.
- **Character overlay**: a transparent, frameless character sprite pinned to the bottom-right corner, wrapped in a gold glow backlight (drop-shadow halo + breathing radial glow). Assets are lazy-loaded from `/pet/jiangxiao/<state>.webp` (10 loop states + 36 transition segments). When the asset pack is absent the overlay does not render — no broken-image flash.
- **DSH session-state follow**: when the `sessions` service is available, the overlay subscribes to the current conversation snapshot and transitions the character through idle / thinking / replying / working / error / permission / done / welcome automatically. Snapshot diffs drive state transitions; subscriptions are released on skin teardown.
- **Asset-import guide**: the settings card probes `HEAD /pet/jiangxiao/idle.webp` on open. When the probe fails (404 / network error / fetch unavailable) the card shows import guidance; when it succeeds the card shows the FX switches instead.

## Requirements

- Node.js >= 20
- pnpm >= 9
- A DSH environment running `dsh web` (default `http://127.0.0.1:3080`)
- Optional: the `dsh-pet` plugin serving `/pet/jiangxiao/*.webp` to enable the character overlay and state follow

## Build and test

```bash
pnpm install     # install dependencies (runs the prepare build automatically)
pnpm build       # builds lib/index.js + lib/client.js
pnpm test        # apply/dispose + overlay + fx + state + follow + settings-card contract tests
```

The built `lib/` is committed with the repo, so you can install even after cloning without building; a full build is still recommended.

## Install into DSH

```bash
dsh plugin --profile web add "link:<absolute path to this repo>"
```

- Spaces in the path (Windows): `dsh plugin add` breaks arguments containing spaces; use this instead:

  ```bash
  cd ~/.dsh/profiles/web
  pnpm add "link:<absolute path to this repo>"
  ```

  Then append `@linxin666/dsh-client-ui-skin-jiangxiao` to the `dsh.profile.bundles` array in `~/.dsh/profiles/web/package.json`.

- After installing, restart `dsh web` and hard-refresh the page (Ctrl+Shift+R).

## Configuration

### FX toggles

The five effects are persisted in `localStorage` under the key `jx-fx` as a JSON object:

```json
{ "shimmer": true, "fall": true, "grain": true, "breathe": true, "micro": true }
```

Toggle any key to `false` to disable that effect, or use the settings card switches. Setting all to `false` makes the skin visually identical to the original (no `fx-*` classes on `<html>`). `prefers-reduced-motion: reduce` forces all five to `false` regardless of storage.

### Character overlay assets

The overlay loads sprites from `/pet/jiangxiao/`. The expected layout (46 files):

- 10 loop states: `idle.webp`, `thinking.webp`, `reading.webp`, `replying.webp`, `working.webp`, `error.webp`, `welcome.webp`, `done.webp`, `permission.webp`, `listening.webp`
- 36 transition segments: `transition-<from>-<to>.webp` (idle hub to all 9 non-idle states forward + reverse, plus thinking <-> replying direct)

When the probe `HEAD /pet/jiangxiao/idle.webp` returns 404 or fails, the overlay does not render and the settings card shows import guidance instead of FX switches.

### Settings card

A first-level settings section (`skin-jiangxiao`, order 125) is registered when the `slots` service is available. It shows the FX switches when assets are ready, or the import guide when assets are missing.

## Switch skins

Skin activation is mutually exclusive and managed via `scripts/dsh-skin` (writes into the managed section of the active Web profile's `<harness-home>/profiles/<profile>/cordis.patch.yml` + the profile symlink):

```bash
dsh-skin use jiangxiao   # activate this skin
dsh-skin use official    # restore the official default look
dsh-skin list            # list skins and the currently active one
```

After switching, the config watcher hot-reloads within seconds; refresh the page to apply.

## Contrast gate

`scripts/check-jiangxiao-contrast.mjs` parses the `--jx-text-*` / `--jx-surface-*` literals in `jiangxiao.module.css` (both dark and light sets) and verifies WCAG 2.1 contrast ratios at build time:

- `--jx-text-strong` / `--jx-text-base` plus the gold-as-text token (dark `--jx-gold` / light `--jx-gold-dim`) >= 4.5:1 on `--jx-surface-0` / `-1` / `-2` / `-3`
- `--jx-text-weak` / `--jx-text-faint` >= 3:1

The gate runs under `pnpm test:scripts` (CI), so any color regression that drops contrast below AA turns red.

## Known limitations

- The inlined woff2 fonts add about 4 MB to `lib/client.js` (base64 expands binary by 1.33x); the trade-off buys offline capability with no external font CDN.
- The skin remaps the full dsh three-layer token system; components that bypass tokens and hardcode colors will not pick up the Tang palette.
- The character overlay and state follow require the `dsh-pet` plugin serving `/pet/jiangxiao/*.webp`. Without it the skin degrades gracefully to the pure-presentation look (no overlay, no state follow, settings card shows import guidance).
- The overlay sprite set (46 webp files) is not bundled with the skin package; it must be provided by `dsh-pet` or an equivalent static server. The `assets/character/` directory in the source tree is the canonical reference set.

## License

BSD-3-Clause
