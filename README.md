# dsh-web-ui · DSH Web UI 皮肤集合

中文 | [English](#english)

一个收集 **DeepSeek Harness Web GUI** 皮肤 / UI 插件的地方。每个皮肤是一个可热插拔的客户端插件包（bundle 加载即生效、卸载即复原），放进 `skins/<name>/`。

> 🔒 本仓库属于 `dsh-external` 组织，**仅组织成员可见**（private）。请勿提交任何凭据、密钥或内部敏感信息。

## ✨ 优质推荐

两个最能打的外观，图为 gallery 试穿界面（`gallery/preview.html`）实拍。

### 🐋 蓝色幻想 · Blue Fantasy

DreamSkin「DeepSeek-鲸鱼娘」Codex 桌面主题的 dsh 适配：**鲸鱼插画背景**垫在半透明面板之下，
遮罩随亮/暗主题**实时切换**；**periwinkle 靛蓝调色板**把全部 dsh token 重映射成静谧的蓝紫色调。

| 亮色试穿 | 暗色试穿 |
| --- | --- |
| ![蓝色幻想 · 亮色试穿](docs/premium/tryon-blue-fantasy-light.png) | ![蓝色幻想 · 暗色试穿](docs/premium/tryon-blue-fantasy-dark.png) |

```sh
dsh-skin use blue-fantasy
```

> ⚠️ `blue-fantasy` 需先安装（见下文「安装皮肤（官方 bundle 方式）」）才能切换。

### 🪟 Windows XP (Luna)

原汁原味的 **Luna** 复古体验：蓝色渐变窗口条 + 窗口按钮、侧边栏任务栏上的绿色**「开始」按钮**、
米色状态栏（大写/数字/滚动指示灯）、**Bliss 蓝天桌面**，全局直角。

| 亮色试穿 | 暗色试穿 |
| --- | --- |
| ![Windows XP · 亮色试穿](docs/premium/tryon-xp-light.png) | ![Windows XP · 暗色试穿](docs/premium/tryon-xp-dark.png) |

```sh
dsh-skin use xp
```

## 结构

```
skins/
  qq98/        第一个入库的皮肤：QQ2008 怀旧版（水晶蓝桌面渐变、玻璃深蓝标题栏、戴围巾企鹅、圆角高光控件）
  ths/         同花顺风格炒股主题（品牌红标题栏、行情状态栏、灰蓝数据终端面板）
  xp/          Windows XP (Luna) 复古主题（蓝色渐变窗口条、绿色开始按钮、米色状态栏、全局直角）
  blue-fantasy/   蓝色幻想：DreamSkin「DeepSeek-鲸鱼娘」Codex 主题适配——鲸鱼插画背景（随亮/暗主题切换遮罩）+ periwinkle 靛蓝调色板 + 半透明面板
  skin-center/    GUI 内嵌皮肤中心插件：设置页 Skins 分区，真实 GUI 内试穿 + 亮暗预览 + 复制应用命令
gallery/      皮肤主题库预览页（index.html 首页 + preview.html 试穿模拟器，双击即可打开）
docs/e2e/     皮肤中心 e2e 截图
docs/premium/ README「优质推荐」的试穿界面截图
scripts/
  dsh-skin          一键切换皮肤的 CLI
  dsh-skin-new      新建皮肤的脚手架（官方标准骨架，配合内置 skin-developer 技能）
  gallery-build     扫描 skins/*/skin.json 重新生成 gallery 静态产物
  skin-center-bundles  重新生成 skin-center 内嵌的皮肤注册表（skins.ts）
  capture-previews  用无头浏览器重拍所有皮肤的亮/暗预览截图
  export-official-facade  从运行中的官方 dsh web GUI 导出样式 + 脱敏 DOM 快照
```

> ⚠️ 同一时刻只接线一个皮肤：两个皮肤都会注入标题栏/状态栏。互斥由 `dsh-skin use <name>` 保证（home 层 `disabled` 行）。

每个皮肤是一个**符合官方插件标准（turtle-ui 式 setup）的自包含包**：

- `skin.json` — **主题库元数据**（id / 名称 / 作者 / tagline / 标签 / 强调色 / bodyAttr / 预览图路径），Gallery 与 `dsh-skin` 都以它为契约
- `src/` — 插件源码（`apply()` 负责挂载，fiber dispose 负责全部收回）
- `cordis.patch.yml` — **bundle patch 层**：向 web 插件表插入自己的 `ui-skin-*` dshClient 行（`package.json` 的 `dsh.bundle.patch` 指向它）
- `package.json` — `dsh.bundle` manifest + `dshClient` 声明 + `prepare` 脚本（自包含构建，`pnpm` 在 git 安装后自动运行）
- `tsdown.config.ts` — 引用仓库根的 `skins/tsdown.client.ts` 自包含预设（官方 `packages/client/tsdown.client.ts` 的 standalone 移植：CSS Modules 内联注入 + 平台模块外部化 + 无类型检查），**不依赖 DSH monorepo**
- `lib/` — **预构建产物**（`client.js` bundle + node half，提交入库，直接可用）
- `preview/` — 亮/暗预览截图（`scripts/capture-previews` 生成，提交入库）

> devDependencies 只用真实发布版本（tsdown / lightningcss / cordis / vitest / jsdom）。
> `@deepseek-ai/dsh-*` 未发布到 npm，运行时由宿主 shell 的 module table 提供，构建时作为 external 处理。

## 皮肤主题库（预览 / 试穿）

仿 Codex-Dream-Skin 的 DreamSkin.cc Gallery 思路，本仓库自带一个**零依赖的主题库预览页**：

```sh
open gallery/index.html        # 或任意静态服务器托管整个仓库
```

- **浏览**：卡片网格展示全部皮肤——真实预览截图（悬停切换亮/暗）、名称、作者、标签、强调色。
- **试穿**：点「试穿」打开内置模拟器——模拟器的**默认外观就是官方 dsh web GUI 本身**：
  `scripts/export-official-facade` 从运行中的官方 GUI 导出样式表与脱敏 DOM 快照
  （`gallery/official-facade.js`），再**真实执行**所选皮肤的 client bundle（shim 掉
  `__ModuleLoader__` 捕获 `exports.apply`，用最小 ctx 调用），皮肤注入的标题栏、状态栏、
  样式表全部真实渲染，支持亮/暗主题切换。模拟器页也可单独打开：
  `gallery/preview.html?skin=qq98&theme=dark`。
- **应用**：点「复制应用命令」得到 `dsh-skin use <name>`，终端执行即可（对应 DreamSkin 的「一键换肤」，
  dsh 的等价物是本地 CLI）。

三个静态产物由脚本生成（提交入库，改皮肤/GUI 后记得重跑）：

```sh
node scripts/gallery-build              # 重新生成 gallery/manifest.js + gallery/bundles.js
node scripts/export-official-facade     # 从运行中的 dsh web GUI 重新导出官方快照（升级 checkout 后必跑）
node scripts/capture-previews           # 重拍全部预览图（需 playwright + chromium）
```

> 升级 dsh checkout 后，官方界面类名/样式可能变化，请重跑 `export-official-facade` 并提交新的
> `gallery/official-facade.js`，模拟器即与官方界面同步。

## 安装皮肤（官方 bundle 方式）

每个皮肤包声明了 `dsh.bundle` + `cordis.patch.yml`，所以用官方 `dsh plugin` 安装即可：

```sh
# 本地路径安装（lib/ 已预构建提交，无需构建授权）
dsh plugin --profile web add ~/code/dsh-web-ui/skins/qq98

# 或从 git 安装（pnpm ≥10 首次会因 prepare 授权失败——把 pnpm 打印的包键
# 加进该 profile 的 pnpm-workspace.yaml 的 allowBuilds 后重试；prepare 会
# 用自包含的 tsdown 配置直接转译 src/，无类型检查、不依赖 monorepo）
dsh plugin --profile web add github:<org>/dsh-web-ui#<commit-sha>
```

安装后 bundle 的 patch 层自动插入 `ui-skin-*` 行（默认生效）。不想用 CLI 的话，
也可以像以前一样把 `skins/<name>/` 拷进 checkout 的 `packages/client/` 作 workspace 包。

## 一键切换皮肤（dsh-skin）

仓库自带 `scripts/dsh-skin`：一条命令在皮肤间互斥切换，无需改配置、无需重启——它重写的是会被配置 watcher 热重载的 `~/.dsh/cordis.patch.yml`，几秒内生效，刷新页面即可看到：

```sh
cp scripts/dsh-skin ~/.local/bin/   # 安装（一次即可）
dsh-skin install qq98               # 用官方 dsh plugin add 装进 web profile（首次）
dsh-skin list                       # 看所有皮肤 + 当前激活 + symlink 状态
dsh-skin use qq98                   # 切到 QQ2008
dsh-skin use xp                     # 切到 Windows XP（Luna）
dsh-skin current                    # 打印当前皮肤
```

工具会：

- `install` 走官方通道：`dsh plugin --profile web add <repo>/skins/<name>`（profile 可用 `DSH_SKIN_PROFILE` 覆盖）；
- `use` 自动维护 profile 的 node_modules symlink（`~/.dsh/profiles/node_modules/@deepseek-ai/`），让皮肤包始终可解析；
- 在 `~/.dsh/cordis.patch.yml` 里维护一个互斥的皮肤段：目标皮肤插入、其余皮肤 `disabled`（含 bundle 层已接线的 `ui-skin-xp`），保证同一时刻只有一个皮肤生效。

⚠️ 皮肤名与 `skins/` 目录一一对应；换机器后，改脚本顶部的 `SKINS` 注册表（仓库路径）即可。

## GUI 内嵌皮肤中心（设置页 Skins 分区）

`skins/skin-center/` 是一个 client 插件（`@deepseek-ai/dsh-client-ui-skin-center`，id `ui-skin-center`），
把皮肤列表/试穿/应用内嵌进真实 GUI 的设置页：

- **列表**：全部皮肤（名称/tagline/强调色），当前激活皮肤带 **Active** 标记（读 `window.__DSH_BOOT__`）。
- **试穿**：真实执行所选皮肤的 client bundle（走页面自己的 `__ModuleLoader__` +
  `window.__DSH_MODULES__.import`），chrome 立即生效；亮/暗切换走官方 theme 服务；
  **退出试穿完全还原**——激活皮肤的样式、DOM、favicon、标题、背景全部恢复。
- **互斥**：试穿期间按配方收回激活皮肤的视觉写面（body 属性、背景内联样式、body 直接子节点中的
  chrome、xp 的 footer taskbar），退出后原样恢复；同一时刻只有一套皮肤。
- **应用**：浏览器无持久化通道（调研结论），「Apply」复制 `dsh-skin use <name>` 命令，终端执行生效。

接线（个人环境，不在 checkout 提交）：

```sh
dsh plugin --profile web add ~/code/dsh-web-ui/skins/skin-center   # 官方安装（bundle patch 自带 ui-skin-center 行）
```

皮肤/元数据变更后重跑 `node scripts/skin-center-bundles`（重新内嵌 bundle 文本），并按
`skins/skin-center/README.md` 在 checkout 里重建。e2e 截图见 `docs/e2e/skin-center/`。

## 从源码开发

本仓库是 pnpm workspace（`skins/*`），根目录一条命令装齐全部构建依赖：

```sh
pnpm install            # 首次；会顺带跑每个皮肤的 prepare（自包含构建 lib/）
pnpm build              # 重建全部皮肤 lib/（等价 pnpm -r build）
pnpm test               # 跑全部皮肤的 vitest（apply 收回语义断言）
```

皮肤 bundle 由 `skins/tsdown.client.ts` 预设构建（CSS Modules 自动注入 + 平台模块外部化 +
`__ModuleLoader__.load` 闭包工厂），它是官方 checkout 预设的 standalone 移植，不依赖 monorepo。

## 新增一个皮肤

仓库内置了 `skin-developer` 技能（`.dsh/skills/skin-developer/SKILL.md`，任何克隆本仓库的
agent 都会自动发现）和脚手架脚本，一条命令生成符合官方标准的完整骨架：

```sh
pnpm skin:new matrix          # 生成 skins/matrix/（官方 bundle 四件套 + 契约测试 + README）
```

然后按脚本提示填写 `skin.json` 与样式，跑 `pnpm build && pnpm test`，在
`gallery/preview.html?skin=<name>` 里试穿，最后把新皮肤发布进皮肤中心：

```sh
node scripts/skin-center-bundles    # 重新内嵌注册表（skins/skin-center/src/client/generated/skins.ts）
pnpm --filter @deepseek-ai/dsh-client-ui-skin-center build
node scripts/gallery-build && node scripts/capture-previews
```

完整流程、验收清单与常见坑见 `.dsh/skills/skin-developer/SKILL.md`。要点：

1. `apply()` 只写自己会收回的东西（属性、DOM、标题、favicon），dispose 时全部还原。
2. 样式全部挂在**你自己的 body 属性**下（如 `body[data-dsh-skin='<name>']`），避免与其它皮肤互相干扰；深色模式用 `[data-ds-dark-theme]` 变体。
3. 提交时一并附上 lib/、preview/、重新生成的注册表与 gallery 产物。

## 要求

- 面板级样式依赖 `ui-layout` AppFrame 的 `data-pane` 钩子（含这些属性的 ui-layout 版本）。
- 皮肤是纯呈现层：不注入服务、不发事件、不触及模型请求。

---

## English

A collection of **DeepSeek Harness Web GUI** skins and UI plugins. Every skin is a hot-pluggable client plugin bundle (load to apply, unload to restore), living under `skins/<name>/`.

> 🔒 This repository is private to the `dsh-external` organization — **organization members only**. Never commit credentials or sensitive material.

## ✨ Premium Picks

The two most impressive looks, shot live from the gallery try-on simulator (`gallery/preview.html`).

### 🐋 Blue Fantasy (蓝色幻想)

DSH adaptation of the DreamSkin "DeepSeek-鲸鱼娘" Codex desktop theme: a **whale-art backdrop** sits beneath
translucent panes, its scrim **swapping live with the light/dark theme**; a **periwinkle-indigo palette**
remaps every dsh token into a serene blue-violet mood.

| Light try-on | Dark try-on |
| --- | --- |
| ![Blue Fantasy light](docs/premium/tryon-blue-fantasy-light.png) | ![Blue Fantasy dark](docs/premium/tryon-blue-fantasy-dark.png) |

```sh
dsh-skin use blue-fantasy
```

> ⚠️ `blue-fantasy` first needs its package installed (see "Installing skins (official bundle way)" below).

### 🪟 Windows XP (Luna)

Faithful **Luna** retro experience: blue gradient window chrome with caption buttons, a green **Start** button
on the sidebar taskbar, cream status bar (CAPS/NUM/SCRL indicators), the **Bliss** sky desktop, all square-cornered.

| Light try-on | Dark try-on |
| --- | --- |
| ![Windows XP light](docs/premium/tryon-xp-light.png) | ![Windows XP dark](docs/premium/tryon-xp-dark.png) |

```sh
dsh-skin use xp
```

- `skins/qq98/` — the first collected skin: the QQ2008 retro edition (crystal-blue desktop gradient, glassy navy title bar, scarf-wearing penguin, rounded highlighted controls). Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- `skins/ths/` — the Tonghuashun-style (同花顺) stock-trading theme: brand-red title bar, quote status bar (红涨绿跌), gray-blue data-terminal panels. Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- `skins/xp/` — the Windows XP (Luna) retro theme: blue gradient window chrome with caption buttons, green Start button, cream status bar with CAPS/NUM/SCRL indicators, square corners. Ships a prebuilt `lib/client.js` (CSS inlined) plus source.
- **Theme gallery with try-on** (inspired by Codex-Dream-Skin's DreamSkin.cc): open `gallery/index.html` — zero dependencies, works from `file://` or any static host. Cards show every skin's real light/dark screenshots (hover to flip), metadata from `skins/<name>/skin.json`, and two actions: **试穿 (try-on)** opens a simulator whose *stock look is the official dsh web GUI itself* — `scripts/export-official-facade` snapshots the running official GUI's stylesheet + sanitized DOM into `gallery/official-facade.js`, then the simulator *actually executes the skin's client bundle* (`__ModuleLoader__` + minimal `ctx` shims) — injected title bars, status bars and styles all render for real, with light/dark toggle; **复制应用命令 (copy apply command)** gives `dsh-skin use <name>`. The simulator alone: `gallery/preview.html?skin=qq98&theme=dark`.
- **Regeneration**: `node scripts/gallery-build` re-scans `skins/*/skin.json` and rewrites `gallery/manifest.js` + `gallery/bundles.js`; `node scripts/export-official-facade` re-snapshots the official GUI (re-run after a checkout upgrade); `node scripts/capture-previews` re-shoots every light/dark preview PNG (needs `npm i` + `npx playwright install chromium`). Commit regenerated assets with changes.
- **Installing skins (official bundle way)**: every skin package declares `dsh.bundle` + `cordis.patch.yml` in the official turtle-ui shape, so the canonical install is `dsh plugin --profile web add ~/code/dsh-web-ui/skins/<skin>` (prebuilt `lib/` is committed) or `dsh plugin --profile web add github:<org>/dsh-web-ui#<sha>` — pnpm ≥10 asks once for `allowBuilds` authorization because git installs run the package's self-contained `prepare` build (dedicated tsdown config, no project references, no type checking). The bundle patch inserts the skin's `ui-skin-*` row automatically. The old "copy the dir into the checkout" flow still works.
- **One-command switching**: `scripts/dsh-skin` rewrites the hot-reloaded `~/.dsh/cordis.patch.yml` and keeps the profile node_modules symlinks (`~/.dsh/profiles/node_modules/@deepseek-ai/`) in sync — `cp scripts/dsh-skin ~/.local/bin/`, then `dsh-skin install qq98` (official `dsh plugin add`; profile overridable via `DSH_SKIN_PROFILE`), `dsh-skin use qq98|xp|ths|blue-fantasy`, `dsh-skin list`, `dsh-skin current`. The target skin gets its insert row, every other skin (including the bundle-layer-wired `ui-skin-xp`) gets a `disabled` row, so exactly one skin is ever live; the config watcher applies the switch within seconds — refresh the page.
- **Development**: the repo is a pnpm workspace (`skins/*`) — `pnpm install` at the root installs all build deps and runs each skin's `prepare`; `pnpm build` / `pnpm test` rebuild all bundles / run all vitest specs. The bundle preset lives at `skins/tsdown.client.ts`, a standalone port of the checkout's `packages/client/tsdown.client.ts` (CSS-modules auto-inject, platform-module externals, `__ModuleLoader__.load` closure factory, no type checking, no monorepo imports).
- **Add a skin**: run `pnpm skin:new <kebab-name>` — the repo ships a built-in `skin-developer` skill (`.dsh/skills/skin-developer/SKILL.md`, auto-discovered by any agent working in a clone) plus the `scripts/dsh-skin-new` scaffold, which generates the official bundle skeleton (package.json with `dsh.bundle`/`prepare`, cordis.patch.yml, tsdown.config.ts, skin.json, a minimal apply/dispose client entry, and a contract spec). Fill in `skin.json` and the scoped stylesheet (`body[data-dsh-<name>]`, dark via `[data-ds-dark-theme]`), retract everything on dispose, then `pnpm build`/`pnpm test`, try on via `gallery/preview.html?skin=<name>`, and publish into the skin center with `node scripts/skin-center-bundles` + a skin-center rebuild + `gallery-build` + `capture-previews`. Commit lib/, preview/, and the regenerated registry/gallery assets.
- `skins/blue-fantasy/` — 蓝色幻想 (Blue Fantasy): the DreamSkin "DeepSeek-鲸鱼娘" Codex desktop theme adapted: whale-art backdrop (scrim swaps live with the light/dark theme), periwinkle-indigo palette, translucent panes. Preview: [light](skins/blue-fantasy/preview/light.png) / [dark](skins/blue-fantasy/preview/dark.png).
- **In-GUI skin center** (`skins/skin-center/`): a client plugin (`@deepseek-ai/dsh-client-ui-skin-center`) adding a **Skins** section to the real GUI's settings page — lists every skin (Active badge from `window.__DSH_BOOT__`), **Try on** executes the actual skin client bundle through the page's own `__ModuleLoader__`/`__DSH_MODULES__` (real chrome, light/dark via the official theme service), **Exit try-on** fully restores the active skin (attribute, backdrop, chrome, favicon, title), and **Apply** copies the `dsh-skin use <name>` command (the GUI has no persisted-config write channel — researched). Mutual exclusion is recipe-based retraction of the active skin's visual writes. Regenerate its embedded registry with `node scripts/skin-center-bundles`; build instructions in `skins/skin-center/README.md`; e2e screenshots in `docs/e2e/skin-center/`.

See `skins/qq98/README.md` for the full wiring walkthrough.
