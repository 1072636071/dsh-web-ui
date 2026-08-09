# @deepseek-ai/dsh-client-ui-skin-qq98

[English](README.md) | 中文

dsh web GUI 的 QQ2008 怀旧皮肤——dsh web ui 家族里收录的第一个皮肤，已从最初的 QQ98/OICQ 版升级到 QQ2008 水晶蓝年代。以客户端插件方式热插拔：`apply()` 设置 `data-dsh-retro` body 属性（整张样式表的生效范围）、渲染固定的玻璃深蓝标题栏和浅蓝状态栏、固定文档标题并注入戴围巾的企鹅 favicon；effect 清理器会收回全部写入——属性、两条栏、favicon，以及标题（除非会话标题已经覆盖了它）。样式表随 bundle 的 CSS-modules 自动注入，loader 会随条目一并移除。

皮肤只做呈现：不注入服务、不发 cordis 事件、不触及模型请求。深色调色板（`body[data-dsh-retro][data-ds-dark-theme]`）是同款水晶蓝外观的「深夜」变体，基础主题系统依然在其下正常切换 token。

## 安装（官方 bundle 方式）

该包是一个独立的 dsh 插件——`cordis.patch.yml` 会在安装时注入其 `dshClient` 条目，因此无需手动编辑 `web.cordis.yml`。

1. git 安装：`dsh plugin --profile <name> add github:<org>/dsh-web-ui#<commit-sha>`。在 pnpm ≥10 下首次安装可能因 `prepare` 脚本不在允许列表而被拒绝授权——把 pnpm 打印出的包键加进该 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 后重试即可（`prepare` 通过本仓库 `skins/` 下的 `tsdown.config.ts` 预设自包含地构建 `lib/`，无需 monorepo 引用）。
2. 本地路径安装：`dsh plugin --profile <name> add /path/to/dsh-web-ui/skins/qq98`（`lib/` 已预构建并提交，不会触发构建步骤）。
3. 用 `dsh-skin use qq98`（本仓库 `scripts/dsh-skin` 辅助脚本）切换皮肤；同一时刻只激活一个皮肤。

移除该插件（连同其注入的条目）即可回到默认外观。

## 依赖

面板级 chrome（侧栏渐变、会话/详情面板表面）依赖 `ui-layout` 中 AppFrame 列携带的 `data-pane` 属性；没有它们皮肤依然生效，只是缺少各面板的表面样式。

## 模型体验

无。皮肤只改浏览器 DOM，不触及模型请求。

#### KV Cache 影响

无；本包既不组装也不发送任何 provider 请求。

## 已知限制

- 加载页保持原样。外壳的启动页先于插件 bundle 渲染，皮肤从定型后的 UI 开始生效（属性一旦设置，启动页也能获得窗口边框，但内部卡片仍是现代样式）。
- 主题切换在皮肤内部。皮肤在 `data-ds-dark-theme` 两种状态下都钉住自己的调色板；在 Appearance 切换主题得到的是浅色/深色两套怀旧配色，而不是非怀旧外观。
