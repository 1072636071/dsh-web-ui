# dsh-web-ui · DSH Web UI 皮肤集合

中文 | [English](#english)

一个收集 **DeepSeek Harness Web GUI** 皮肤 / UI 插件的地方。每个皮肤是一个可热插拔的客户端插件包（bundle 加载即生效、卸载即复原），放进 `skins/<name>/`。

> 🔒 本仓库属于 `dsh-external` 组织，**仅组织成员可见**（private）。请勿提交任何凭据、密钥或内部敏感信息。

## 结构

```
skins/
  qq98/        第一个入库的皮肤：QQ2008 怀旧版（水晶蓝桌面渐变、玻璃深蓝标题栏、戴围巾企鹅、圆角高光控件）
  ths/         同花顺风格炒股主题（品牌红标题栏、行情状态栏、灰蓝数据终端面板）
  xp/          Windows XP (Luna) 复古主题（蓝色渐变窗口条、绿色开始按钮、米色状态栏、全局直角）
  blue-fantasy/   蓝色幻想：DreamSkin「DeepSeek-鲸鱼娘」Codex 主题适配——鲸鱼插画背景（随亮/暗主题切换遮罩）+ periwinkle 靛蓝调色板 + 半透明面板
gallery/      皮肤主题库预览页（index.html 首页 + preview.html 试穿模拟器，双击即可打开）
scripts/
  dsh-skin          一键切换皮肤的 CLI
  gallery-build     扫描 skins/*/skin.json 重新生成 gallery 静态产物
  capture-previews  用无头浏览器重拍所有皮肤的亮/暗预览截图
```

> ⚠️ 同一时刻只接线一个皮肤：两个皮肤都会注入标题栏/状态栏。换皮肤 = 把 `web.cordis.yml` 里的皮肤行换成另一个（见各皮肤 README）。

每个皮肤包含：

- `skin.json` — **主题库元数据**（id / 名称 / 作者 / tagline / 标签 / 强调色 / bodyAttr / 预览图路径），Gallery 与 `dsh-skin` 都以它为契约
- `src/` — 插件源码（`apply()` 负责挂载，fiber dispose 负责全部收回）
- `lib/client.js` — **预构建 bundle**（含内联 CSS，直接可用）
- `preview/` — 亮/暗预览截图（`scripts/capture-previews` 生成，提交入库）
- `package.json` / `tsdown.config.ts` — 在 DSH checkout 内重新构建所需的元数据

## 皮肤主题库（预览 / 试穿）

仿 Codex-Dream-Skin 的 DreamSkin.cc Gallery 思路，本仓库自带一个**零依赖的主题库预览页**：

```sh
open gallery/index.html        # 或任意静态服务器托管整个仓库
```

- **浏览**：卡片网格展示全部皮肤——真实预览截图（悬停切换亮/暗）、名称、作者、标签、强调色。
- **试穿**：点「试穿」打开内置模拟器——它**真实执行**所选皮肤的 client bundle（shim 掉
  `__ModuleLoader__` 捕获 `exports.apply`，用最小 ctx 调用），皮肤注入的标题栏、状态栏、样式表
  全部真实渲染，支持亮/暗主题切换。模拟器页也可单独打开：`gallery/preview.html?skin=qq98&theme=dark`。
- **应用**：点「复制应用命令」得到 `dsh-skin use <name>`，终端执行即可（对应 DreamSkin 的「一键换肤」，
  dsh 的等价物是本地 CLI）。

两个静态产物由 `scripts/gallery-build` 生成（提交入库，改皮肤后记得重跑并附新截图）：

```sh
node scripts/gallery-build     # 重新生成 gallery/manifest.js + gallery/bundles.js
node scripts/capture-previews  # 重拍全部预览图（需 playwright + chromium）
```

## 快速接入（预构建 bundle）

1. 把 `skins/<name>/` 整个目录拷进 DSH checkout 的 `packages/client/`（作为 workspace 包）。
2. 在 `apps/cli/config/web.cordis.yml` 加一行：

   ```yaml
   - id: <skin-id>
     name: '@deepseek-ai/dsh-client-<skin-name>'
   ```

3. 在 `apps/cli/package.json` 的 dependencies 和 `tsconfig.client.json` 的 references 里各加一项（包名对应）。
4. `pnpm install` 后重启 `dsh web`，刷新页面即生效；移除行和包即还原默认外观。

## 一键切换皮肤（dsh-skin）

仓库自带 `scripts/dsh-skin`：一条命令在皮肤间互斥切换，无需改配置、无需重启——它重写的是会被配置 watcher 热重载的 `~/.dsh/cordis.patch.yml`，几秒内生效，刷新页面即可看到：

```sh
cp scripts/dsh-skin ~/.local/bin/   # 安装（一次即可）
dsh-skin list                       # 看所有皮肤 + 当前激活 + symlink 状态
dsh-skin use qq98                   # 切到 QQ2008
dsh-skin use xp                     # 切到 Windows XP（Luna）
dsh-skin current                    # 打印当前皮肤
```

工具会：

- 自动维护 profile 的 node_modules symlink（`~/.dsh/profiles/node_modules/@deepseek-ai/`），让皮肤包始终可解析；
- 在 `~/.dsh/cordis.patch.yml` 里维护一个互斥的皮肤段：目标皮肤插入、其余皮肤 `disabled`（含 bundle 层已接线的 `ui-skin-xp`），保证同一时刻只有一个皮肤生效。

⚠️ 皮肤名与 `skins/` 目录一一对应；换机器或换 checkout 后，改脚本顶部的 `SKINS` 注册表即可。
`blue-fantasy` 需先把包装进 checkout 才可切换，`dsh-skin list/use` 会给出提示。

## 从源码开发

把皮肤包放进 checkout 后：

```sh
pnpm --filter @deepseek-ai/dsh-client-<skin-name> run bundle   # 重建 lib/client.js
pnpm --filter @deepseek-ai/dsh-frontend run build              # 若改了壳层
```

皮肤 bundle 由 checkout 的 `packages/client/tsdown.client.ts` 预设构建（CSS Modules 自动注入 + 平台模块外部化）。

## 新增一个皮肤

1. 复制 `skins/qq98/` 作为模板，改包名、id 和文案。
2. 写 `skin.json`（id / 名称 / 作者 / tagline / 标签 / 强调色 / bodyAttr / 预览图路径）——Gallery 和 `dsh-skin` 都以它为契约。
3. 样式全部挂在**你自己的 body 属性**下（如 `body[data-dsh-skin='<name>']`），避免与其它皮肤互相干扰；深色模式用 `[data-ds-dark-theme]` 变体。
4. `apply()` 只写自己会收回的东西（属性、DOM、标题、favicon），dispose 时全部还原。
5. 跑 `node scripts/gallery-build && node scripts/capture-previews` 重新生成 gallery 产物和亮/暗预览图，提交时一并附上。

## 要求

- 面板级样式依赖 `ui-layout` AppFrame 的 `data-pane` 钩子（含这些属性的 ui-layout 版本）。
- 皮肤是纯呈现层：不注入服务、不发事件、不触及模型请求。

---

## English

A collection of **DeepSeek Harness Web GUI** skins and UI plugins. Every skin is a hot-pluggable client plugin bundle (load to apply, unload to restore), living under `skins/<name>/`.

> 🔒 This repository is private to the `dsh-external` organization — **organization members only**. Never commit credentials or sensitive material.

- `skins/qq98/` — the first collected skin: the QQ2008 retro edition (crystal-blue desktop gradient, glassy navy title bar, scarf-wearing penguin, rounded highlighted controls). Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- `skins/ths/` — the Tonghuashun-style (同花顺) stock-trading theme: brand-red title bar, quote status bar (红涨绿跌), gray-blue data-terminal panels. Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- `skins/xp/` — the Windows XP (Luna) retro theme: blue gradient window chrome with caption buttons, green Start button, cream status bar with CAPS/NUM/SCRL indicators, square corners. Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- **Theme gallery with try-on** (inspired by Codex-Dream-Skin's DreamSkin.cc): open `gallery/index.html` — zero dependencies, works from `file://` or any static host. Cards show every skin's real light/dark screenshots (hover to flip), metadata from `skins/<name>/skin.json`, and two actions: **试穿 (try-on)** opens a simulator that *actually executes the skin's client bundle* (`__ModuleLoader__` + minimal `ctx` shims) — injected title bars, status bars and styles all render for real, with light/dark toggle; **复制应用命令 (copy apply command)** gives `dsh-skin use <name>`. The simulator alone: `gallery/preview.html?skin=qq98&theme=dark`.
- **Regeneration**: `node scripts/gallery-build` re-scans `skins/*/skin.json` and rewrites `gallery/manifest.js` + `gallery/bundles.js`; `node scripts/capture-previews` re-shoots every light/dark preview PNG (needs `npm i` + `npx playwright install chromium`). Commit regenerated assets with skin changes.
- **Quick use**: copy the skin dir into a DSH checkout's `packages/client/`, add a `dshClient` row to `apps/cli/config/web.cordis.yml`, add the package to `apps/cli/package.json` and `tsconfig.client.json`, `pnpm install`, restart `dsh web`, refresh. Wire **only one skin row at a time** — two skins both inject title/status bars.
- **One-command switching**: `scripts/dsh-skin` rewrites the hot-reloaded `~/.dsh/cordis.patch.yml` and keeps the profile node_modules symlinks (`~/.dsh/profiles/node_modules/@deepseek-ai/`) in sync — `cp scripts/dsh-skin ~/.local/bin/`, then `dsh-skin use qq98|xp|ths|blue-fantasy`, `dsh-skin list`, `dsh-skin current`. The target skin gets its insert row, every other skin (including the bundle-layer-wired `ui-skin-xp`) gets a `disabled` row, so exactly one skin is ever live; the config watcher applies the switch within seconds — refresh the page. `blue-fantasy` needs its package installed into the checkout first (the script warns otherwise).
- **Add a skin**: clone `skins/qq98/`, write `skin.json` (the gallery/dsh-skin contract), scope your styles under your own body attribute, retract everything on dispose, then re-run `gallery-build` + `capture-previews` and commit the regenerated assets.
- `skins/blue-fantasy/` — 蓝色幻想 (Blue Fantasy): the DreamSkin "DeepSeek-鲸鱼娘" Codex desktop theme adapted: whale-art backdrop (scrim swaps live with the light/dark theme), periwinkle-indigo palette, translucent panes. Preview: [light](skins/blue-fantasy/preview/light.png) / [dark](skins/blue-fantasy/preview/dark.png).

See `skins/qq98/README.md` for the full wiring walkthrough.
