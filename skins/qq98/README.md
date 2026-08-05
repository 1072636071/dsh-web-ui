# @deepseek-ai/dsh-client-ui-skin-qq98

English | [中文](README.zh.md)

QQ98 retro skin for the dsh web GUI — the first skin collected in the dsh web ui family. Hot-pluggable as a client plugin: `apply()` sets the `data-dsh-retro` body attribute (the scope of the whole stylesheet), renders the fixed Win98 title bar and status bar, pins the document title and injects the penguin favicon; its effect disposer retracts every write (the attribute, both bars, the favicon, and the title unless a session title already replaced it). The stylesheet rides the bundle's CSS-modules auto-inject, so the loader removes it with the entry.

The skin is presentation-only: no services are injected, no cordis events are emitted, and nothing reaches a model request. The dark palette (`body[data-dsh-retro][data-ds-dark-theme]`) is a darker "night" take on the same era, so the base theme system keeps flipping tokens underneath.

## Wiring it into a checkout

1. Add the package to the checkout as a workspace package (or as an `apps/cli` dependency resolving the package).
2. Add a `dshClient` row to `apps/cli/config/web.cordis.yml`:
   `- id: ui-skin-qq98` / `name: '@deepseek-ai/dsh-client-ui-skin-qq98'`.
3. Add `@deepseek-ai/dsh-client-ui-skin-qq98` to `apps/cli/package.json` dependencies and a `references` entry in `tsconfig.client.json`.
4. `pnpm --filter @deepseek-ai/dsh-client-ui-skin-qq98 run bundle` (and rebuild the frontend dist), then restart `dsh web`/refresh the page.

Removing the row (and the package) returns the GUI to its stock look.

## Requirements

The pane-level chrome (sidebar gradient, conversation/details surfaces) keys on the `data-pane` attributes the AppFrame columns carry in `ui-layout`; without them the skin still applies, minus the per-pane surfaces.

## Model Experience

None. The skin mutates only the browser DOM; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- **The loading page is stock** — the shell's boot page renders before plugin bundles exist, so the skin starts at the settled UI (the boot page still gets the window frame once the attribute is set, but its inner card keeps the modern look).
- **Theme setting semantics** — the skin pins its own palette under both `data-ds-dark-theme` states; switching Appearance themes flips between the light and dark retro palettes, not to a non-retro look.
