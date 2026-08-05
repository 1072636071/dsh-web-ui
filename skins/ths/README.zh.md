# @deepseek-ai/dsh-client-ui-skin-ths

[English](README.md) | 中文

dsh web GUI 的同花顺风格炒股皮肤。作为客户端插件热插拔：`apply()` 设置 `data-dsh-ths` body 属性（整张样式表的生效范围）、渲染固定的品牌红标题栏和行情状态栏（上证指数 / 深证成指 / 创业板指，红涨绿跌配色）、固定文档标题并注入「同」字 favicon；其 effect 清理器会收回全部写入（属性、两条栏、favicon，以及标题——除非会话标题已经覆盖了它）。样式表随 bundle 的 CSS-modules 自动注入，loader 会随条目一并移除。

皮肤纯属呈现层：不注入任何服务、不发出任何 cordis 事件、不触及模型请求。深色调色板（`body[data-dsh-ths][data-ds-dark-theme]`）是夜间交易变体，基础主题系统依然在其下正常切换 token。滚动条别名保持基础主题不变，皮肤之下滚动条契约不变。

## 接入一个 checkout

1. 把该包作为 workspace 包放入 checkout（或作为能解析到该包的 `apps/cli` 依赖）。
2. 在 `apps/cli/config/web.cordis.yml` 加一行 `dshClient`：
   `- id: ui-skin-ths` / `name: '@deepseek-ai/dsh-client-ui-skin-ths'`。
3. 在 `apps/cli/package.json` 的 dependencies 和 `tsconfig.client.json` 的 references 里各加一项。
4. `pnpm --filter @deepseek-ai/dsh-client-ui-skin-ths run bundle`（并重建前端 dist），重启 `dsh web` / 刷新页面。

同一时刻只应接线一个皮肤行——两个皮肤会同时注入窗口 chrome。移除该行（连同包）即可回到默认外观。

## 依赖

面板级 chrome（侧栏渐变、会话/详情面板表面）依赖 `ui-layout` 中 AppFrame 列携带的 `data-pane` 属性；没有它们皮肤依然生效，只是缺少各面板的表面样式。

## 模型体验

无。皮肤只改浏览器 DOM；这里没有任何内容进入模型请求。

#### KV Cache 影响

无；该包（package）既不组装也不发送提供方请求。

## 已知限制与暂缓事项

- **加载页保持原样**——外壳的启动页先于插件 bundle 渲染，皮肤从定型后的 UI 开始生效（属性一旦设置，启动页也能获得窗口边框，但内部卡片仍是现代样式）。
- **主题设置语义**——皮肤在 `data-ds-dark-theme` 两种状态下都钉住自己的调色板；在 Appearance 切换主题得到的是浅色/深色两套交易终端配色，而不是非皮肤外观。
- **行情单元格是装饰性的**——状态栏里的指数数值是固定文案，只为外观，不跟踪实时行情。
