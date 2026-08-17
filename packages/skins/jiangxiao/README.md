# dsh-client-ui-skin-jiangxiao · Jiangxiao Ink-Dyed theme skin

English | [中文](README.zh.md)

A Tang-style anime theme skin for the DeepSeek Harness (DSH) Web GUI, ported from the openCodeMM `Jiangxiao · Ink-Dyed` design system.

- **Palette**: ink-black ground, dark-gold text, mist-purple atmosphere, cinnabar accent (dark default "Moonlit Ink-Dyed"); rice-white ground, pink plum, gold (light variant "Plum Blossom")
- **Dual theme**: dark is the default; light follows the DSH dark/light signal automatically (`body[data-ds-dark-theme]`)
- **Token-level port**: `--jx-*` tokens remapped onto the dsh three-layer token system (`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`), so every component lands in the Tang-ink era
- **Decorative layer**: cinnabar seal send button, title-bar Tang cloud pattern with gold end-rule, gold scrollbar, cinnabar favicon, document title
- **Fonts**: two woff2 fonts inlined (Ma Shan Zheng kaiti + Noto Serif SC song), offline-capable, `@font-face` carries `local()` fallback chains
- **Syntax highlighting**: code blocks keep the upstream `--syntax-*` palette untouched

![Light](preview/light.png) · ![Dark](preview/dark.png)

## Features

- Pure presentation layer: no services injected, no events emitted, no model requests touched
- `apply()` only writes what it withdraws; the disposer fully recovers (body attribute, @font-face style, injected chrome, favicon, title)
- All styles hang under `body[data-dsh-jiangxiao]` (light variant `:not([data-ds-dark-theme])`)
- No static asset files: fonts are embedded as base64 data URLs in the JS bundle
- `prefers-reduced-motion` disables all motion

## Requirements

- Node.js >= 20
- pnpm >= 9
- A DSH environment running `dsh web` (default `http://127.0.0.1:3080`)

## Build and test

```bash
pnpm install     # install dependencies (runs the prepare build automatically)
pnpm build       # builds lib/index.js + lib/client.js
pnpm test        # apply/dispose contract test
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

## Switch skins

Skin activation is mutually exclusive and managed via `scripts/dsh-skin` (writes into the managed section of the active Web profile's `<harness-home>/profiles/<profile>/cordis.patch.yml` + the profile symlink):

```bash
dsh-skin use jiangxiao   # activate this skin
dsh-skin use official    # restore the official default look
dsh-skin list            # list skins and the currently active one
```

After switching, the config watcher hot-reloads within seconds; refresh the page to apply.

## Configuration

Optional overrides, read from `localStorage` (all are optional; absent or invalid values fall back to the defaults). They are pure presentation — no services, no events:

| Key | Value | Effect |
| --- | --- | --- |
| `dsh.jiangxiao.title` | any string | Replaces the pinned title ("姜晓 · 墨染 · DeepSeek 在线") in the title bar and document title |
| `dsh.jiangxiao.cells` | JSON array of strings | Replaces the status-bar cells, e.g. `["墨染", "唐风"]` |

Example:

```js
localStorage.setItem('dsh.jiangxiao.title', '姜晓工坊')
localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['墨染', '唐风']))
location.reload()
```

## Known limitations

- The inlined woff2 fonts add about 4 MB to `lib/client.js` (base64 expands binary by 1.33x); the trade-off buys offline capability with no external font CDN.
- The skin remaps the full dsh three-layer token system; components that bypass tokens and hardcode colors will not pick up the Tang palette.
- Preview PNGs are placeholder swatches; replace `preview/light.png` and `preview/dark.png` with real screenshots when a capture pass is available.

## License

BSD-3-Clause