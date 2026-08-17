# chrome 瘦身与装饰级删除

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 姜晓皮肤 apply() 不再向 DSH Web GUI 注入任何 DSH 原生不存在的 DOM 元素。用户启用姜晓皮肤后，不再看到叠在 DSH titlebar 之上的顶部固定条（印章 + 唐风标题 + 窗口按钮）、不再看到底部状态栏（朱砂点 + 状态单元）、浏览器 tab 标题不被皮肤硬设、favicon 不被朱砂印章 roundel 替换、发送按钮不被朱砂印章化、按钮和输入框不被硬编码阴影覆盖、body 不被加 padding、#root 不被加边框和阴影。DSH 原生 UI 完全主导布局，姜晓皮肤只通过 token remap 和 CSS 美化已有 DOM。

**验收标准：**

- [ ] apply() 不再创建 `.jiangxiaoTitlebar` / `.jiangxiaoStatusbar` 元素；body 无 `[data-skin-chrome="titlebar"]` / `[data-skin-chrome="statusbar"]` 子元素
- [ ] apply() 不再注入 favicon `<link rel="icon">`；head 无皮肤注入的 favicon
- [ ] apply() 不再覆盖 `document.title`；DSH 的 DocumentTitle 服务全权管理 tab 标题
- [ ] apply() 不再创建印章发送钮样式；`[data-action='prompt-submit']` 不被朱砂化（无强制圆角/红边/红阴影）
- [ ] CSS 不再含 `.jiangxiaoTitlebar*` / `.jiangxiaoStatusbar*` class 规则
- [ ] CSS 不再含 `button` / `button:hover` / `button:active` 的硬编码 `box-shadow` + `background-image: none`
- [ ] CSS 不再含 `input` / `textarea` / `select` 的硬编码 `box-shadow` + `background` + `color`
- [ ] CSS 不再含 `body[data-dsh-jiangxiao]` 的 `padding: 34px 8px 32px`
- [ ] `#root` 不再含 `border` + `box-shadow`，保留 `background: transparent`
- [ ] apply() 保留：body `data-dsh-jiangxiao` 属性、`@font-face` 字体注入（`data-skin-chrome="fontface"` style）、locale 注册、settings section 注册
- [ ] apply.spec.ts 契约测试更新：移除 chrome 条/favicon/title/localStorage override 断言；保留 body 属性 + 字体注入断言；dispose 后全部回收断言保持绿色
- [ ] `pnpm build` + `pnpm test`（含 apply.spec.ts）绿

## 评论

（评论与对话历史追加于此，新内容置于最前。）
