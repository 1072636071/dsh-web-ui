# @deepseek-ai/dsh-client-ui-skin-qq98

[English](README.md) | 中文

dsh web GUI 的 QQ2008 怀旧皮肤——dsh web ui 家族里收录的第一个皮肤，已从最初的 QQ98/OICQ 版升级到 QQ2008 水晶蓝年代。作为客户端插件热插拔：`apply()` 设置 `data-dsh-retro` body 属性（整张样式表的生效范围）、渲染固定的玻璃深蓝标题栏和浅蓝状态栏、固定文档标题并注入戴围巾的企鹅 favicon；其 effect 清理器会收回全部写入（属性、两条栏、favicon，以及标题——除非会话标题已经覆盖了它）。样式表随 bundle 的 CSS-modules 自动注入，loader 会随条目一并移除。

皮肤纯属呈现层：不注入任何服务、不发出任何 cordis 事件、不触及模型请求。深色调色板（`body[data-dsh-retro][data-ds-dark-theme]`）是同款水晶蓝外观的「深夜」变体，基础主题系统依然在其下正常切换 token。

## 接入一个 checkout

1. 把该包作为 workspace 包放入 checkout（或作为能解析到该包的 `apps/cli` 依赖）。
2. 在 `apps/cli/config/web.cordis.yml` 加一行 `dshClient`：
   `- id: ui-skin-qq98` / `name: '@deepseek-ai/dsh-client-ui-skin-qq98'`。
3. 在 `apps/cli/package.json` 的 dependencies 和 `tsconfig.client.json` 的 references 里各加一项。
4. `pnpm --filter @deepseek-ai/dsh-client-ui-skin-qq98 run bundle`（并重建前端 dist），重启 `dsh web` / 刷新页面。

移除该行（连同包）即可回到默认外观。

## 依赖

面板级 chrome（侧栏渐变、会话/详情面板表面）依赖 `ui-layout` 中 AppFrame 列携带的 `data-pane` 属性；没有它们皮肤依然生效，只是缺少各面板的表面样式。

## 模型体验

无。皮肤只改浏览器 DOM；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包（package）既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **加载页保持原样**——外壳的启动页先于插件 bundle 渲染，皮肤从定型后的 UI 开始生效（属性一旦设置，启动页也能获得窗口边框，但内部卡片仍是现代样式）。
- **主题设置语义**——皮肤在 `data-ds-dark-theme` 两种状态下都钉住自己的调色板；在 Appearance 切换主题得到的是浅色/深色两套怀旧配色，而不是非怀旧外观。
