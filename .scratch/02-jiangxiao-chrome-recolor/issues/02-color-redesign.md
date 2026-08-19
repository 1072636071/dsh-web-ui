# 颜色重设计 + gold 拆分 + 浅色加深

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** 姜晓皮肤的 `--jx-*` token 字面量（深浅双套）全部按唐风墨染设计哲学为 DSH 重新设计，让 DSH 所有读 token 的组件继承的对比度达 WCAG AA。深色变体（月夜墨染：墨黑底/暗金文/雾紫氛/朱砂点睛）和浅色变体（梅花：米白底/粉梅/金）的正文文字在对应 surface 上达 4.5:1，弱化文字达 3:1。gold 族拆分为文字专用（`--jx-text-gold`）和装饰专用（`--jx-gold`），让链接/强调/tab-title 等文字位置用专门达 AA 的金 token，边框/图标/渐变等装饰位置保持亮金感。浅色 cinnabar/seal 加深为深梅红，wisteria 加深到 AA。

**验收标准：**

- [ ] 深色 `--jx-text-strong` / `--jx-text-base` 在 `--jx-surface-0` / `-1` / `-2` / `-3` 上达 WCAG AA 4.5:1
- [ ] 深色 `--jx-text-weak` 达 3:1、`--jx-text-faint` 达 3:1
- [ ] 浅色 `--jx-text-strong` / `--jx-text-base` 在 `--jx-surface-0` / `-1` / `-2` / `-3` 上达 4.5:1（修复 `#8d7a70` 3.0:1、`#b3a296` 1.8:1 等不足）
- [ ] 浅色 `--jx-text-weak` 达 3:1、`--jx-text-faint` 达 3:1
- [ ] 新增 `--jx-text-gold` token（深色 `#d6b34a`、浅色 `#8a6508`，在对应 surface-0 上达 AA 4.5:1）
- [ ] `--jx-gold` 语义收窄为装饰专用（保留原色相，用于边框/图标背景/渐变/滚动条等非文字位置）
- [ ] `--dsw-alias-brand-text` 改映射到 `var(--jx-text-gold)`（不再映射到 `--jx-gold`）
- [ ] 浅色 `--jx-cinnabar` / `--jx-seal` 加深为深梅红（如 `#8e3a49` 或更深），在浅底上达 AA 4.5:1
- [ ] 浅色 `--jx-wisteria`（visited 链接色）加深到 AA 4.5:1
- [ ] `--jx-gold-foil` gradient 色标重设计，确保最暗点对 surface-0 达 AA 4.5:1（为工单 03 烫金箔准备）
- [ ] 保持 token 名字和三层 remap 结构（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`）不变，只改字面量值 + 新增 `--jx-text-gold`
- [ ] 保持唐风墨染设计哲学：墨黑/米白 surface + 金族 + 朱砂/梅红 seal + 雾紫氛围的色相骨架不变
- [ ] `pnpm build` 绿

## 评论

- 2026-08-19 核实：CSS 深浅双套 `--jx-surface-0/-1/-2/-3`、`--jx-text-strong/base/weak/faint`、`--jx-seal`/`--jx-cinnabar` 均已重做（浅色 seal/cinnabar=#8e3a49、text-base=#5d4a42）。gold 拆分：原 02 轮的 `--jx-text-gold` 在金族在 04 轮已归并为深 `--jx-gold`(#d6b34a)/浅 `--jx-gold-dim`(#6f5306) 作为文字金，`--dsw-alias-brand-text` 映射到文字金 token。

（评论与对话历史追加于此，新内容置于最前。）
