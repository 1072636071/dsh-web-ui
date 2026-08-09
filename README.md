# dsh-web-ui · DSH Web UI 皮肤集合

中文 | [English](#english)

本仓库收集 DeepSeek Harness Web GUI 的皮肤 / UI 插件。每个皮肤是一个客户端插件包（bundle），放进 `skins/<name>/`，加载即生效、卸载即复原。

> 本仓库属于 `dsh-external` 组织，仅组织成员可见（private）。请勿提交任何凭据、密钥或内部敏感信息。

## 优质推荐

两个最能打的外观，图为 gallery 试穿界面（`gallery/preview.html`）实拍。

### 蓝色幻想 · Blue Fantasy

DreamSkin「DeepSeek-鲸鱼娘」Codex 桌面主题的 dsh 适配：鲸鱼插画背景垫在半透明面板之下，遮罩随亮/暗主题实时切换；periwinkle 靛蓝调色板把全部 dsh token 重映射成蓝紫色调。

| 亮色试穿 | 暗色试穿 |
| --- | --- |
| ![蓝色幻想 · 亮色试穿](docs/premium/tryon-blue-fantasy-light.png) | ![蓝色幻想 · 暗色试穿](docs/premium/tryon-blue-fantasy-dark.png) |

```sh
dsh-skin use blue-fantasy
```

> 注意：`blue-fantasy` 需先安装（`dsh-skin install blue-fantasy`）才能切换。

### Windows XP (Luna)

原汁原味的 Luna 复古体验：蓝色渐变窗口条 + 窗口按钮、侧边栏任务栏上的绿色「开始」按钮、米色状态栏（大写/数字/滚动指示灯）、Bliss 蓝天桌面，全局直角。

| 亮色试穿 | 暗色试穿 |
| --- | --- |
| ![Windows XP · 亮色试穿](docs/premium/tryon-xp-light.png) | ![Windows XP · 暗色试穿](docs/premium/tryon-xp-dark.png) |

```sh
dsh-skin use xp
```

---

## English

A collection of DeepSeek Harness Web GUI skins and UI plugins. Each skin is a client plugin bundle living under `skins/<name>/`: load it to apply, unload it to restore.

> This repository is private to the `dsh-external` organization. Organization members only. Never commit credentials or sensitive material.

## Premium Picks

The two standouts, shot live from the gallery try-on simulator (`gallery/preview.html`).

### Blue Fantasy (蓝色幻想)

A dsh port of the DreamSkin "DeepSeek-鲸鱼娘" Codex desktop theme: whale-art backdrop beneath translucent panes, a scrim that swaps with the light/dark theme, and a periwinkle-indigo palette that remaps every dsh token into blue-violet tones.

| Light try-on | Dark try-on |
| --- | --- |
| ![Blue Fantasy light](docs/premium/tryon-blue-fantasy-light.png) | ![Blue Fantasy dark](docs/premium/tryon-blue-fantasy-dark.png) |

```sh
dsh-skin use blue-fantasy
```

> Warning: `blue-fantasy` first needs its package installed (`dsh-skin install blue-fantasy`).

### Windows XP (Luna)

Retro Luna done right: blue gradient window chrome with caption buttons, a green Start button on the sidebar taskbar, cream status bar with CAPS/NUM/SCRL indicators, the Bliss desktop, square corners everywhere.

| Light try-on | Dark try-on |
| --- | --- |
| ![Windows XP light](docs/premium/tryon-xp-light.png) | ![Windows XP dark](docs/premium/tryon-xp-dark.png) |

```sh
dsh-skin use xp
```
