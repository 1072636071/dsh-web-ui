# 令牌与 remap 对齐 tokens.css

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** 以 `.scratch/skin-preview/tokens.css` 为唯一令牌事实源，返工皮肤样式模块的令牌层（首轮实现已落地一版令牌，本工单是其对齐返工）：`--jx-*` 规范令牌按 tokens.css 暗（墨金卷轴银杏）/浅（宣纸梅花）双值表逐条补齐——surface / text / gold（bright·gold·deep·dim·ginkgo·foil）/ seal / cinnabar / border-deco / ink-glow / scroll / 代码语法（code-bg·code-border·kw·str·fn·cmt·num）/ petal-1·2·3 / poem-color / font（display·ui·code）/ motion（dur-fast·dur·breathe·gold-rotate·shimmer·leaf-fall-min·leaf-fall-max·seal-pulse·bpulse）/ radius（sm·md·lg·xl·seal）/ shadow（shadow-1·shadow-2·gold-rim）/ layout（sidebar-w·files-w）。`--dsw-static-*` / `--dsw-alias-*` / `--dsw-specific-*` remap 到唐风色板，暗/亮走官方信号 body[data-ds-dark-theme]。用户视角：启用皮肤后深浅双主题完整、无色值缺失、对比度达标、代码块五色语法高亮。

**验收标准：**

- [ ] tokens.css 每个令牌在皮肤令牌层落地且暗浅双值齐全，缺一即违规
- [ ] tokens.css 未覆盖但 DSH remap 必需的辅助令牌按唐风色板派生保留：状态族 success/warn/error（石绿/藤黄/赭朱，供 `--dsw-alias-state-*` 与 `--aion-*`）、selection 选中色、visited 链接色（取 seal/梅红族）；均暗浅双值、达 WCAG AA
- [ ] remap 原则落地：neutral/bluish→墨阶 surface，blue/deepseek→金族，green/red/amber→石绿/赭朱/藤黄，alias/specific 全部指向 --jx-*
- [ ] 皮肤作用域 body[data-dsh-jiangxiao]，浅色 = :not([data-ds-dark-theme])
- [ ] 组件层无颜色字面量、无主题选择器（L3 规则）
- [ ] 侧边栏底色用 surface 色阶（非 #b8860b 整片），金色退居 active accent / 边框 / 装饰点缀；侧边栏文字对比度 ≥ 4.5
- [ ] 深浅两主题肉眼可验：深底浅字、WCAG AA 对比度
- [ ] 不用纯 #fff/#000；渐变仅 --jx-gold-foil 与氛围墨晕渐变
- [ ] tokens.spec.ts 对齐新令牌表（外部行为断言，不测具体色值实现细节）

## 评论

- 2026-08-19：设计基准切换为 `.scratch/skin-preview/`。首轮实现落地的令牌族中未被本设计引用的定义（如氛围族 mist/mountain/water/cloud/moon/hair）随本工单清理或对齐；`--jx-text-gold` 与 tokens.css 的文本金色用法（gold-bright 系）做一致性归并，保持 brand-text 达 AA。
- 2026-08-19（落地）：tokens.css 全族落地（代码语法/petal/poem/ink-glow/动效时长/radius-seal/布局），氛围族与 text-gold/wisteria/hl-* 已退役；文字金归并为 --jx-gold（深）/ --jx-gold-dim（浅），对比度门禁按变体校验通过；tokens.spec / check-jiangxiao-contrast 同步更新，门禁全绿。
