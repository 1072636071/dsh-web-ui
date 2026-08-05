# @deepseek-ai/dsh-client-ui-skin-xp

English | [中文](README.zh.md)

Windows XP (Luna) skin for the dsh web GUI. Hot-pluggable as a client plugin: `apply()` sets the `data-dsh-xp` body attribute (the scope of the whole stylesheet), renders the fixed Luna-blue title bar with the four-color window-flag mark and caption buttons (minimize / maximize / close), the classic cream status bar (就绪 / DeepSeek 在线 with the sunken CAPS/NUM/SCRL indicators 大写 数字 滚动), a green 开始 Start button in the taskbar-blue sidebar footer that opens the settings dialog, Explorer-style tree rows (light-blue hover, `#316ac5` blue selection), a Bliss-style desktop sky behind the window frame and square corners everywhere; pins the document title and injects the four-color-flag favicon; its effect disposer retracts every write (the attribute, both bars, the Start button, the favicon, and the title unless a session title already replaced it). The stylesheet rides the bundle's CSS-modules auto-inject, so the loader removes it with the entry.

The skin is presentation-only: no services are injected, no cordis events are emitted, and nothing reaches a model request. The dark palette (`body[data-dsh-xp][data-ds-dark-theme]`) is the Zune-style black variant, so the base theme system keeps flipping tokens underneath. Scrollbar aliases stay on the base theme, keeping the stock scrollbar contract under the skin.

## Wiring it into a checkout

1. Add the package to the checkout as a workspace package (or as an `apps/cli` dependency resolving the package).
2. Add a `dshClient` row to `apps/cli/config/web.cordis.yml`:
   `- id: ui-skin-xp` / `name: '@deepseek-ai/dsh-client-ui-skin-xp'`.
3. Add `@deepseek-ai/dsh-client-ui-skin-xp` to `apps/cli/package.json` dependencies and a `references` entry in `tsconfig.client.json`.
4. `pnpm --filter @deepseek-ai/dsh-client-ui-skin-xp run bundle` (and rebuild the frontend dist), then restart `dsh web`/refresh the page.

Only one skin row should be wired at a time — two skins would both inject chrome. Removing the row (and the package) returns the GUI to its stock look.

## Requirements

The pane-level chrome (sidebar band, Explorer rows, taskbar footer, conversation/details surfaces) keys on the `data-pane` attributes the AppFrame columns carry in `ui-layout`; without them the skin still applies, minus the per-pane surfaces.

## Model Experience

None. The skin mutates only the browser DOM; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **The loading page is stock** — the shell's boot page renders before plugin bundles exist, so the skin starts at the settled UI (the boot page still gets the window frame once the attribute is set, but its inner card keeps the modern look).
- **Theme setting semantics** — the skin pins its own palette under both `data-ds-dark-theme` states; switching Appearance themes flips between the light Luna and dark Zune palettes, not to a non-skin look.
- **The Start button only opens settings** — it forwards its click to the existing settings trigger in the sidebar footer; it does not host a real start menu.
- **The four-color flag is a flat approximation** — the waving Windows flag is rendered as a flat 2×2 flag mark, inline SVG, not the authentic waved logo.
