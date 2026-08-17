# 姜晓皮肤包（深浅双主题）

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 皮肤中心出现「姜晓·墨染」皮肤卡，用户启用后整个 dsh Web GUI 切换为唐风二次元配色（深色默认「月夜墨染」：墨黑底/暗金文/雾紫氛/朱砂点睛；浅色跟随系统自动变「梅花」：米白底/粉梅/金），标题栏、发送按钮、favicon、字体随之匹配，启用/停用干净无残留，皮肤中心预览展示深浅两态截图。

**验收标准：**

- [ ] 皮肤中心出现 `jiangxiao` 皮肤卡，含 `name/nameEn/tagline/description/accent/bodyAttr/package/wiring/preview(light+dark)` 完整元数据与两张预览图
- [ ] 启用后 `body[data-dsh-jiangxiao]` 生效，`--dsw-static-*`/`--dsw-alias-*`/`--aion-*` 三层 token 按 `--jx-*` 语义重映射，深色默认
- [ ] 浅色变体经 `body[data-dsh-jiangxiao]:not([data-ds-dark-theme])` 生效，跟随 DSH 深浅信号自动切换
- [ ] 装饰级落地：朱砂印章发送钮、标题栏唐风纹样、favicon、文档标题、金线滚动条/分隔
- [ ] 2 个 woff2 字体内置（Ma Shan Zheng + Noto Serif SC），离线可用，`@font-face` 含 local() 回退链
- [ ] 代码块/语法高亮保持 `--syntax-*` 上游配色，`prefers-reduced-motion` 下动效全关
- [ ] 停用皮肤后注入的样式/装饰/标题/favicon 全部还原，无残留（try-on 与正式启用同源）
- [ ] `pnpm build` + 全仓门禁绿（含 `docs:check`）；皮肤包 README 中英配对就绪（与 07 协作）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
