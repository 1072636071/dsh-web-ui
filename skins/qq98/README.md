# @deepseek-ai/dsh-client-ui-skin-qq98

English | [中文](README.zh.md)

QQ2008 retro skin for the dsh web GUI. It was the first skin collected in the dsh web ui family, upgraded from the original QQ98/OICQ edition to the QQ2008 crystal-blue era. It plugs in as a client plugin: `apply()` sets the `data-dsh-retro` body attribute (the whole stylesheet's scope), renders the fixed glassy-navy title bar and pale-blue status bar, pins the document title, and injects the scarf-wearing penguin favicon. Its effect disposer retracts every write — the attribute, both bars, the favicon, and the title unless a session title already replaced it. The stylesheet ships inside the bundle via CSS-modules auto-inject, so the loader removes it when the entry is disposed.

The skin is presentation-only: no services are injected, no cordis events are emitted, nothing reaches a model request. The dark palette (`body[data-dsh-retro][data-ds-dark-theme]`) is a deeper "night" take on the same crystal-blue look, so the base theme system keeps flipping tokens underneath.

## Installing (official bundle)

The package is a standalone dsh plugin — `cordis.patch.yml` injects its `dshClient` row on install, so there is no manual `web.cordis.yml` editing.

1. Install from git: `dsh plugin --profile <name> add github:<org>/dsh-web-ui#<commit-sha>`. With pnpm ≥10 the first install may reject the `prepare` script for not being on the allow-list — add the package key pnpm prints to that profile's `pnpm-workspace.yaml` `allowBuilds` list and retry. `prepare` self-containedly builds `lib/` (via the `tsdown.config.ts` preset in this repo's `skins/`), no monorepo reference needed.
2. Or install from a local path: `dsh plugin --profile <name> add /path/to/dsh-web-ui/skins/qq98` (`lib/` is pre-built and committed, so no build step runs).
3. Switch skins with `dsh-skin use qq98` (the `scripts/dsh-skin` helper in this repo); only one skin is active at a time.

Removing the plugin (and the row it injected) returns the GUI to its stock look.

## Requirements

The pane-level chrome (sidebar gradient, conversation/details surfaces) keys on the `data-pane` attributes the AppFrame columns carry in `ui-layout`; without them the skin still applies, minus the per-pane surfaces.

## Model Experience

None. The skin mutates only the browser DOM; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known limitations

- The loading page stays stock. The shell's boot page renders before plugin bundles exist, so the skin starts at the settled UI (the boot page still gets the window frame once the attribute is set, but its inner card keeps the modern look).
- Theme switching is skin-internal. The skin pins its own palette under both `data-ds-dark-theme` states; switching Appearance themes flips between the light and dark retro palettes, not to a non-retro look.
