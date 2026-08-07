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
```

> ⚠️ 同一时刻只接线一个皮肤：两个皮肤都会注入标题栏/状态栏。换皮肤 = 把 `web.cordis.yml` 里的皮肤行换成另一个（见各皮肤 README）。

每个皮肤包含：

- `src/` — 插件源码（`apply()` 负责挂载，fiber dispose 负责全部收回）
- `lib/client.js` — **预构建 bundle**（含内联 CSS，直接可用）
- `package.json` / `tsdown.config.ts` — 在 DSH checkout 内重新构建所需的元数据

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

## 从源码开发

把皮肤包放进 checkout 后：

```sh
pnpm --filter @deepseek-ai/dsh-client-<skin-name> run bundle   # 重建 lib/client.js
pnpm --filter @deepseek-ai/dsh-frontend run build              # 若改了壳层
```

皮肤 bundle 由 checkout 的 `packages/client/tsdown.client.ts` 预设构建（CSS Modules 自动注入 + 平台模块外部化）。

## 新增一个皮肤

1. 复制 `skins/qq98/` 作为模板，改包名、id 和文案。
2. 样式全部挂在**你自己的 body 属性**下（如 `body[data-dsh-skin='<name>']`），避免与其它皮肤互相干扰；深色模式用 `[data-ds-dark-theme]` 变体。
3. `apply()` 只写自己会收回的东西（属性、DOM、标题、favicon），dispose 时全部还原。
4. 用 e2e / 截图验证组装后的外观，提交时附上预览。

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
- **Quick use**: copy the skin dir into a DSH checkout's `packages/client/`, add a `dshClient` row to `apps/cli/config/web.cordis.yml`, add the package to `apps/cli/package.json` and `tsconfig.client.json`, `pnpm install`, restart `dsh web`, refresh. Wire **only one skin row at a time** — two skins both inject title/status bars.
- **One-command switching**: `scripts/dsh-skin` rewrites the hot-reloaded `~/.dsh/cordis.patch.yml` and keeps the profile node_modules symlinks (`~/.dsh/profiles/node_modules/@deepseek-ai/`) in sync — `cp scripts/dsh-skin ~/.local/bin/`, then `dsh-skin use qq98|xp|ths`, `dsh-skin list`, `dsh-skin current`. The target skin gets its insert row, every other skin (including the bundle-layer-wired `ui-skin-xp`) gets a `disabled` row, so exactly one skin is ever live; the config watcher applies the switch within seconds — refresh the page.
- **Add a skin**: clone `skins/qq98/`, scope your styles under your own body attribute, retract everything on dispose, verify the assembled look before submitting.

See `skins/qq98/README.md` for the full wiring walkthrough.
