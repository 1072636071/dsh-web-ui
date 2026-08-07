# @deepseek-ai/dsh-client-ui-skin-deepseek-whale

English | [中文](README.zh.md)

The **DeepSeek-鲸鱼娘** Codex desktop theme (DreamSkin, MIT, author powerdog996) adapted for the dsh web GUI: the whale-art backdrop rides behind translucent panes (the big surfaces are alpha-blended tokens, so the art glows through), with a live scrim that flips with the base light/dark theme and a periwinkle-indigo palette remapped onto every dsh token. Hot-pluggable as a client plugin: `apply()` sets the `data-dsh-whale` body attribute (the scope of the whole stylesheet), applies the whale art as a fixed full-viewport backdrop (base64 data URL with a readability scrim chosen by the current theme, swapped live on `data-ds-dark-theme` changes), and injects the whale favicon; its effect disposer retracts every write (the attribute, the backdrop inline styles — restoring whatever was there before — and the favicon). The stylesheet rides the bundle's CSS-modules auto-inject, so the loader removes it with the entry.

The skin is presentation-only: no services are injected, no cordis events are emitted, and nothing reaches a model request. The dark palette (`body[data-dsh-whale][data-ds-dark-theme]`) is a night-whale take on the same art — a deep indigo veil over the dimmed backdrop — so the base theme system keeps working underneath.

## Wiring it into a checkout

1. Add the package to the checkout as a workspace package (or as an `apps/cli` dependency resolving the package).
2. Add a `dshClient` row to the web profile's patch:
   `- id: ui-skin-deepseek-whale` / `name: '@deepseek-ai/dsh-client-ui-skin-deepseek-whale'`.
3. `pnpm --filter @deepseek-ai/dsh-client-ui-skin-deepseek-whale run bundle` (or use the prebuilt `lib/client.js`), then restart `dsh web`/refresh the page.

Removing the row (and the package) returns the GUI to its stock look.

## The backdrop art

`src/client/art.ts` embeds the theme's `background.jpg` (2278×1280) compressed to 1920×1079 JPEG q76 (~210KB) as a data URL; the README comment there shows the exact regeneration steps. The light scrim is an ice veil, the dark one a deep indigo veil — both tuned so text stays readable over the brightest and darkest parts of the art.

## Preview

Light ([preview/light.png](preview/light.png)) · Dark ([preview/dark.png](preview/dark.png)) — captured against a stock web profile on 0807.

## Requirements

The ambient translucency is token-level (`--dsw-alias-bg-*`, `--dsw-specific-sidebar-fill`), so it applies regardless of pane layout. `backdrop-filter` is deliberately unused: a blurred ancestor becomes the containing block for fixed-position overlays (the settings panel would render trapped inside the sidebar column).

## Model Experience

None. The skin mutates only the browser DOM; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.
