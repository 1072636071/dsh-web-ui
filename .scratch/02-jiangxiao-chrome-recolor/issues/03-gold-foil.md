# 烫金箔引入

**Status:** ready-for-agent

**Blocked by:** 02

**构建内容：** 姜晓皮肤的 h1-h4 标题呈现唐风烫金箔质感——`background-clip: text` 配合 `--jx-gold-foil` gradient，让标题文字呈现金色渐变流动感，保留唐风墨染的核心辨识度。不支持 `background-clip: text` 的浏览器回退到 `--jx-text-gold` 纯色（仍达 AA）。`strong/b` 强调元素保持亮金纯色，不叠加烫金箔（避免小尺寸 gradient text 糊）。

**验收标准：**

- [ ] `h1, h2, h3, h4` 应用 `background-clip: text`（或 `-webkit-background-clip: text`）+ `background: var(--jx-gold-foil)` + `color: transparent` + `-webkit-text-fill-color: transparent`
- [ ] `@supports` 兜底：不支持 `background-clip: text` 时回退到 `color: var(--jx-text-gold)` + `-webkit-text-fill-color: var(--jx-text-gold)` 纯色
- [ ] 深色和浅色双套都有烫金箔规则（浅色用浅色版 `--jx-gold-foil`）
- [ ] `strong, b` 保持 `color: var(--jx-gold-bright)` 纯色，不叠加 `background-clip: text`
- [ ] 标题 `letter-spacing` 从 `0.02em` 收紧到 `0.01em`
- [ ] 烫金箔 gradient 色标最暗点对 surface-0 达 AA 4.5:1（工单 02 已保证 `--jx-gold-foil` 色标）
- [ ] `prefers-reduced-motion` 不受影响（烫金箔是静态渐变，非动效）
- [ ] `pnpm build` 绿

## 评论

（评论与对话历史追加于此，新内容置于最前。）
