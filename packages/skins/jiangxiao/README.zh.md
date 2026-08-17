# dsh-client-ui-skin-jiangxiao · 姜晓·墨染主题皮肤

[English](README.md) | 中文

为 DeepSeek Harness（DSH）Web GUI 打造的唐风二次元主题皮肤，源自 openCodeMM「姜晓·墨染」设计系统。

- **配色**：墨黑底、暗金文、雾紫氛、朱砂点睛（深色默认「月夜墨染」）；米白底、粉梅、金（浅色变体「梅花」）
- **双主题**：深色为默认，浅色跟随 DSH 深浅信号自动切换（`body[data-ds-dark-theme]`）
- **token 级移植**：`--jx-*` 令牌语义映射到 dsh 三层 token（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`），所有组件统一进入唐风墨染调
- **装饰级**：朱砂印章发送钮、标题栏唐风云纹与金线端饰、金线滚动条、朱砂 favicon、文档标题
- **字体**：内置 2 个 woff2 字体（Ma Shan Zheng 楷体 + Noto Serif SC 宋体），离线可用，`@font-face` 含 `local()` 回退链
- **语法高亮**：代码块保持上游 `--syntax-*` 配色不改

![浅色](preview/light.png) · ![深色](preview/dark.png)

## 特性

- 纯呈现层：不注入服务、不发事件、不触模型请求
- `apply()` 只写自己会收回的东西，disposer 完整回收（body 属性、@font-face 样式、注入元素、favicon、标题）
- 样式全部挂在 `body[data-dsh-jiangxiao]` 下（浅色变体 `:not([data-ds-dark-theme])`）
- 无静态资源文件：字体以 base64 data URL 内嵌进 JS bundle
- `prefers-reduced-motion` 下动效全关

## 环境要求

- Node.js ≥ 20
- pnpm ≥ 9
- 已运行 `dsh web` 的 DSH 环境（默认 `http://127.0.0.1:3080`）

## 构建与测试

```bash
pnpm install     # 安装依赖（自动执行 prepare 构建）
pnpm build       # 构建 lib/index.js + lib/client.js
pnpm test        # apply/dispose 契约测试
```

构建产物 `lib/` 已随仓库提交，克隆后即使跳过构建也可安装；但建议完整构建一次。

## 安装到 DSH

```bash
dsh plugin --profile web add "link:<本仓库绝对路径>"
```

- 路径含空格（Windows）：`dsh plugin add` 会把含空格的参数拆断，请改用：

  ```bash
  cd ~/.dsh/profiles/web
  pnpm add "link:<本仓库绝对路径>"
  ```

  然后把 `@linxin666/dsh-client-ui-skin-jiangxiao` 追加到 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 数组。

- 安装后重启 `dsh web`，强制刷新页面（Ctrl+Shift+R）。

## 切换皮肤

皮肤启用互斥，通过 `scripts/dsh-skin` 管理（写入当前 Web profile 的 `<harness-home>/profiles/<profile>/cordis.patch.yml` managed 区段 + profile 链接）：

```bash
dsh-skin use jiangxiao   # 启用本皮肤
dsh-skin use official    # 恢复官方默认外观
dsh-skin list            # 查看皮肤与当前激活项
```

切换后 config watcher 会在几秒内热重载，刷新页面即可生效。

## 配置

可选覆盖项，从 `localStorage` 读取（均可选；缺失或非法值回退默认）。纯呈现层——不注入服务、不发事件：

| Key | 值 | 效果 |
| --- | --- | --- |
| `dsh.jiangxiao.title` | 任意字符串 | 替换标题栏与文档标题中固定的标题（「姜晓 · 墨染 · DeepSeek 在线」） |
| `dsh.jiangxiao.cells` | JSON 字符串数组 | 替换状态栏单元格，例如 `["墨染", "唐风"]` |

示例：

```js
localStorage.setItem('dsh.jiangxiao.title', '姜晓工坊')
localStorage.setItem('dsh.jiangxiao.cells', JSON.stringify(['墨染', '唐风']))
location.reload()
```

## 已知限制

- 内置 woff2 字体使 `lib/client.js` 增加约 4 MB（base64 较二进制放大 1.33×）；代价换来离线可用、无需外部字体 CDN。
- 本皮肤重映射 dsh 三层 token 体系；绕过 token 硬编码颜色的组件不会进入唐风调。
- 预览 PNG 为占位色板；有截图采集条件时请用真实截图替换 `preview/light.png` 与 `preview/dark.png`。

## License

BSD-3-Clause