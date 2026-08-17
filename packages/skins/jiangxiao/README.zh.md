# dsh-client-ui-skin-jiangxiao · 姜晓·墨染主题皮肤

[English](README.md) | 中文

为 DeepSeek Harness（DSH）Web GUI 打造的唐风二次元主题皮肤，源自 openCodeMM「姜晓·墨染」设计系统。

- **配色**：墨黑底、暗金文、雾紫氛、朱砂点睛（深色默认「月夜墨染」）；米白底、粉梅、金（浅色变体「梅花」）
- **双主题**：深色为默认，浅色跟随 DSH 深浅信号自动切换（`body[data-ds-dark-theme]`）
- **token 级移植**：`--jx-*` 令牌语义映射到 dsh 三层 token（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`），所有组件统一进入唐风墨染调。`--jx-text-gold` 拆为文字专用金（在每个 surface 上达 AA）；`--jx-gold` 收窄为装饰专用（边框、图标背景、渐变、滚动条）。
- **装饰级**：h1-h4 烫金箔（`background-clip: text`，`@supports` 兜底回退 `--jx-text-gold`）、titlebar-v2 唐风云纹端饰、金线滚动条、::selection、strong/b 亮金、:focus-visible outline。无 chrome 条、无 favicon、不覆盖 document.title、不硬编码 button/input。
- **字体**：内置 2 个 woff2 字体（Ma Shan Zheng 楷体 + Noto Serif SC 宋体），离线可用，`@font-face` 含 `local()` 回退链
- **语法高亮**：代码块保持上游 `--syntax-*` 配色不改

![浅色](preview/light.png) · ![深色](preview/dark.png)

## 特性

- 纯呈现层：不注入服务、不发事件、不触模型请求
- `apply()` 只写自己会收回的东西，disposer 完整回收（body 属性、@font-face 样式）
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

## 对比度门禁

`scripts/check-jiangxiao-contrast.mjs` 解析 `jiangxiao.module.css` 中的 `--jx-text-*` / `--jx-surface-*` 字面量（深浅双套），按 WCAG 2.1 对比度公式在构建时校验：

- `--jx-text-strong` / `--jx-text-base` / `--jx-text-gold` 在 `--jx-surface-0` / `-1` / `-2` / `-3` 上 >= 4.5:1
- `--jx-text-weak` / `--jx-text-faint` >= 3:1

门禁接入 `pnpm test:scripts`（CI），任何使对比度跌破 AA 的颜色回退都会变红。

## 已知限制

- 内置 woff2 字体使 `lib/client.js` 增加约 4 MB（base64 较二进制放大 1.33×）；代价换来离线可用、无需外部字体 CDN。
- 本皮肤重映射 dsh 三层 token 体系；绕过 token 硬编码颜色的组件不会进入唐风调。
- 预览 PNG 为占位色板；有截图采集条件时请用真实截图替换 `preview/light.png` 与 `preview/dark.png`。

## License

BSD-3-Clause
