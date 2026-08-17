# PRD: 姜晓皮肤 chrome 瘦身与颜色重设计

Status: ready-for-agent

领域词汇见仓库根目录 `CONTEXT.md`；本 PRD 遵守 `docs/adr/0002-jiangxiao-chrome-trim-and-recolor.md`。承接 `01-jiangxiao`（皮肤本体 + 宠物已落地），本轮是同一皮肤的二次打磨，不涉及宠物。

## 问题陈述

`01-jiangxiao` 落地后，姜晓皮肤在 dsh Web GUI 中出现两个观感问题：

1. **chrome 僵硬**：皮肤 apply() 额外渲染了两条固定 chrome 条——顶部 `.jiangxiaoTitlebar`（带印章 + 唐风标题 + 窗口按钮 `-` `□` `×`）和底部 `.jiangxiaoStatusbar`（带朱砂点 + 状态单元"墨染/楷宋就绪/已连接/在线/唐风正式版"）。但 DSH Web GUI 自己的 titlebar 是 `header[data-slot='titlebar-v2']`（皮肤 CSS 已美化），不需要再叠一条；底部状态栏 DSH 和 openCodeMM 原作都没有。两条 chrome 条是"DSH 没有的、openCodeMM 也没有的"过度搬运，叠在 DSH 原生 UI 之上显得僵硬。

2. **对比度不足，"看起来太怪"**：皮肤直接搬运了 openCodeMM 的 `--jx-*` 字面量并 remap 到 dsh 三层 token，DSH 所有读 token 的组件都继承了 openCodeMM 的对比度缺陷。浅色变体重灾区：`--jx-text-weak` `#8d7a70` on `#faf5ee` 仅 3.0:1（低于 AA 4.5:1）、`--jx-text-faint` `#b3a296` 仅 1.8:1（几乎不可读）、`--jx-gold` `#b8860b` 仅 4.0:1、`--jx-cinnabar` `#b24a5c` 仅 3.2:1。深色变体也有 `--jx-gold-dim` `#996515` 4.0:1、`--jx-text-weak` 在 surface-3 上 4.2:1 等不足。openCodeMM 原作对比度不足是其自身设计缺陷，dsh-web-ui 需按同一设计哲学为 DSH 重新设计色值。

## 解决方案

对姜晓皮肤 `jiangxiao` 做两件事，不改宠物、不改其他皮肤、不改 DSH 源码：

1. **chrome 瘦身**：删除 apply() 渲染的两条固定 chrome 条及附属配置面（`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG`）、删除 favicon 注入、删除 document.title 覆盖、删除印章发送钮朱砂化、删除 button/input 硬编码 box-shadow、删除 body padding、删除 `#root` border/shadow。装饰级切分对齐 openCodeMM `chrome.css` 范围：只美化 DSH 已有 DOM（body 背景、`[data-slot='titlebar-v2']`、滚动条、::selection、headings、:focus-visible），不注入新元素。

2. **颜色重设计**：按唐风墨染设计哲学（墨黑/米白 surface + 金族 + 朱砂/梅红 seal + 雾紫氛围）为 DSH 重新设计 `--jx-*` 字面量，深浅双套全部重做。约束：WCAG AA（4.5:1 正文、3:1 大字/图标/装饰）。新增 `--jx-text-gold`（文字专用金）与 `--jx-gold`（装饰专用金）拆分；浅色 cinnabar/seal 加深为深梅红；引入 `h1-h4` 烫金箔 `background-clip: text`（`@supports` 兜底回退纯色）。新增对比度 CI 门禁脚本防止后续回退。

## 用户故事

### chrome 瘦身

1. 作为 dsh Web GUI 用户，我想要姜晓皮肤不再叠加额外的顶部固定条，以便 DSH 原生 titlebar（`header[data-slot='titlebar-v2']`）成为唯一顶部栏，不出现两条重叠的标题栏。
2. 作为用户，我想要姜晓皮肤不再叠加额外的底部状态栏，以便 DSH 原生布局不被底部固定条遮挡。
3. 作为用户，我想要切回官方默认皮肤后姜晓注入的所有样式与 DOM 元素干净还原，以便不留残留（包括字体 style、body 属性、烫金箔规则等）。
4. 作为用户，我想要 DSH 原生发送按钮外观恢复（由 token 决定颜色，不再被强制圆角化/朱砂红边/红阴影），以便按钮视觉与 DSH 其他按钮一致。
5. 作为用户，我想要浏览器 tab 标题由 DSH 的 DocumentTitle 服务全权管理，不被皮肤硬设覆盖。
6. 作为用户，我想要浏览器 favicon 由 DSH 原生提供，不被皮肤注入的朱砂印章 roundel 替换。
7. 作为用户，我想要 DSH 原生按钮的视觉反馈完全由 `--dsw-alias-button-*-fill` / `*-hover` token 决定，不被硬编码 `rgba(5,3,8,...)` 阴影覆盖，以便 token-driven 一致性。
8. 作为用户，我想要 DSH 原生输入框（input/textarea/select）视觉由 `--dsw-specific-input-major` 等 token 决定，不被硬编码 inset 阴影 + 直接覆盖 background/color 覆盖。
9. 作为用户，我想要 DSH Web GUI 保持全屏沉浸布局，`#root` 不被加边框 + 阴影"窗口化"，以便符合 Web 应用而非桌面窗口的交互范式。
10. 作为用户，我想要 DSH 原生 body 布局不被皮肤的 `padding: 34px 8px 32px` 干扰（那是为已删除的 chrome 条腾位的残留），以便布局壳正常工作。

### 颜色重设计

11. 作为用户，我想要姜晓皮肤深色变体的所有正文文字在对应 surface 上达 WCAG AA 4.5:1，以便长时间阅读不疲劳。
12. 作为用户，我想要姜晓皮肤浅色变体的所有正文文字在对应 surface 上达 WCAG AA 4.5:1，以便浅色模式下文字清晰可读（修复 `#8d7a70` 3.0:1、`#b3a296` 1.8:1 等不足）。
13. 作为用户，我想要姜晓皮肤的弱化文字（faint/装饰位置）达 WCAG AA 3:1，以便辅助信息仍可辨认。
14. 作为用户，我想要链接文字、强调文字、tab-title 等"品牌金"位置用专门的文字金 token，以便对比度达标且不损失金的语义。
15. 作为用户，我想要边框、图标背景、渐变、滚动条等装饰位置保持亮金感，不被加深到失去装饰性。
16. 作为用户，我想要姜晓皮肤浅色变体的点缀色（cinnabar/seal 系）加深为深梅红，以便在浅底上达 AA 4.5:1，同时保持"梅花"语义。
17. 作为用户，我想要姜晓皮肤浅色变体的 visited 链接色（wisteria）加深到 AA，以便浅色下已访问链接可辨认。
18. 作为用户，我想要姜晓皮肤的 h1-h4 标题呈现烫金箔质感（`background-clip: text` 渐变），以便保留唐风墨染的核心辨识度。
19. 作为用户，我想要在不支持 `background-clip: text` 的浏览器上，标题回退到文字金纯色（仍达 AA），以便兼容性不破坏可读性。
20. 作为用户，我想要标题字距收紧到 `0.01em`（从 `0.02em`），以便中文楷体标题更紧凑耐看。
21. 作为用户，我想要 `strong/b` 强调元素用亮金纯色（不叠加烫金箔渐变），以便小尺寸强调文字不糊。
22. 作为用户，我想要代码块/语法高亮保持 DSH 上游 `--syntax-*` 配色，以便代码可读性不受主题装饰影响（沿用 `01-jiangxiao` 既有约束）。
23. 作为用户，我想要 `prefers-reduced-motion` 下所有动效关闭（沿用 `01-jiangxiao` 既有约束）。

### 维护者

24. 作为维护者，我想要一个对比度 CI 门禁脚本，校验 `--jx-text-*` 在 `--jx-surface-*` 上的对比度达 AA，以便后续改动不会无意回退对比度。
25. 作为维护者，我想要对比度门禁接入 `pnpm test:scripts`，以便 CI 全量门禁自动覆盖。
26. 作为维护者，我想要姜晓皮肤的 apply/dispose 契约测试更新，断言不再注入 chrome 条/favicon/document.title，以便回归被及时发现。
27. 作为维护者，我想要 apply/dispose 契约测试断言 `--jx-text-gold` token 存在且 `--dsw-alias-brand-text` 映射到它，以便 token 拆分被锁定。
28. 作为维护者，我想要 apply/dispose 契约测试断言烫金箔 `@supports` 规则存在，以便 D25 决策被锁定。
29. 作为维护者，我想要皮肤包 README 同步更新（删除 chrome 条描述、删除 title/cells 配置面、删除 favicon/title 描述、新增对比度门禁说明），以便 `pnpm docs:check` 保持绿色。
30. 作为维护者，我想要皮肤包 README 中英配对重新录 hash（`pnpm docs:write-pair`），以便 i18n 配对契约不破。

## 实现决策

### D15 chrome 条删除

删除 apply() 渲染的 `.jiangxiaoTitlebar`（顶部固定条）和 `.jiangxiaoStatusbar`（底部固定条）及附属配置面（`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG` / `SKIN_TITLE`）。两条 chrome 条 DSH 和 openCodeMM 原作都没有，违反"DSH 没有的不要搬运"原则。

### D16 装饰级切分

对齐 openCodeMM `chrome.css` 范围。

**保留**：token remap、@font-face 字体、body 背景纹理（云纹 radial-gradient）、`[data-slot='titlebar-v2']` 美化、滚动条金线、::selection、headings 楷体烫金（D25 烫金箔）、strong/b 亮金、:focus-visible outline。

**删除**：两条 chrome 条、印章发送钮（`[data-action='prompt-submit']` 朱砂印章化）、favicon 注入、document.title 覆盖、button/input 硬编码 box-shadow（D21/D22）、body padding（D23）、#root border/shadow（D24）。

### D17 颜色重设计

按唐风墨染设计哲学为 DSH 重新设计 `--jx-*` 字面量，深浅双套全部重做。约束：WCAG AA（4.5:1 正文、3:1 大字/图标/装饰）。只改 dsh 侧 `jiangxiao.module.css`，不回写 openCodeMM（两项目独立，设计哲学一致但色值分叉）。保持 token 名字和三层 remap 结构（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`）不变。

### D18 gold 族拆分

新增 `--jx-text-gold`（文字用，深色 `#d6b34a`、浅色 `#8a6508`，达 AA），`--jx-gold` 语义收窄为装饰专用。`--dsw-alias-brand-text` 映射到 `--jx-text-gold`，装饰 token 映射到 `--jx-gold`。

### D19 浅色点缀色加深

浅色 cinnabar/seal 加深为深梅红（如 `#8e3a49` 或更深），让 `--jx-cinnabar` / `--jx-seal` 在浅底上达 AA 4.5:1。保持"梅花"语义但向"梅红"靠拢。

### D20 对比度 CI 门禁

新增对比度校验脚本，解析 `jiangxiao.module.css` 中的 `--jx-text-*` / `--jx-surface-*` 字面量（深浅双套），按 WCAG 对比度公式校验 `--jx-text-strong`/`--jx-text-base`/`--jx-text-gold` 在 `--jx-surface-0`/`-1`/`-2`/`-3` 上达 4.5:1，`--jx-text-weak`/`--jx-text-faint` 达 3:1，接入 `pnpm test:scripts`。

### D21 button box-shadow 删除

删除 `button` / `button:hover` / `button:active` 的硬编码 `box-shadow` + `background-image: none`。DSH 原生按钮视觉由 `--dsw-alias-button-*-fill` / `*-hover` token 决定；硬编码阴影是拟物硬塞，破坏 token-driven 一致性；唐风墨染不是 neobrutalism，craft-floor 反对硬阴影。

### D22 input 硬编码样式删除

删除 `input` / `textarea` / `select` 的硬编码 `box-shadow` + `background` + `color`。同 D21：DSH 输入框由 `--dsw-specific-input-major` 等 token 决定，硬编码是装饰性越权。

### D23 body padding 删除

删除 `body[data-dsh-jiangxiao]` 的 `padding: 34px 8px 32px`。这是为两条 chrome 条腾位的残留，D15 删 chrome 条后失去动机。openCodeMM `chrome.css` 无 body padding，DSH 原生 body 也不该有 padding。

### D24 #root 边框阴影删除

`body[data-dsh-jiangxiao] [id='root']` 删除 `border` + `box-shadow`，保留 `background: transparent`。border + wide soft shadow 是 craft-floor 反对的 ghost card 反模式；openCodeMM `chrome.css` 只透明化不加边框；DSH Web GUI 全屏沉浸布局不该"窗口化"。

### D25 烫金箔引入

引入 `background-clip: text` 烫金箔应用于 `h1, h2, h3, h4`（对齐 openCodeMM `chrome.css`）。`@supports` 兜底：不支持时回退到 `--jx-text-gold` 纯色。D17 重设计 `--jx-gold-foil` gradient 色标时确保最暗点对 surface-0 达 AA 4.5:1。**不应用**到 `strong/b` 或小字号位置（避免小尺寸 gradient text 糊）。覆盖 craft-floor "gradient text" 反对——唐风墨染的烫金箔是其核心辨识度，brief 优先。标题 `letter-spacing` 从 `0.02em` 收紧到 `0.01em`。

### 被否决的方案（决策密集，供实施者参考）

- **保留 chrome 条只改样式**：违反"DSH 没有的不要搬运"原则，且两条固定条与 DSH 已有 `header[data-slot='titlebar-v2']` 重叠僵硬。否决。
- **同步回写 openCodeMM**：openCodeMM 是独立项目，其对比度问题是自身设计缺陷；dsh-web-ui 仓库规则禁止修改 DSH 源码，openCodeMM 虽非 DSH 源码但跨项目回写超出本仓范围。否决。
- **AAA 7:1 标准线**：调色空间窄，会牺牲唐风氛围。AA 4.5:1 已满足 user_profile 的 WCAG accessibility standards 要求。否决。
- **gold 不拆分、加深 `--jx-gold` 兼作文字色**：会失去"亮金"装饰感，`gold-bright`/`gold`/`gold-deep` 三阶退化为两阶。否决。
- **只删顶部条、保留 statusbar**：底部状态栏 DSH 和 openCodeMM 都没有，且状态单元是模拟窗口 chrome 的氛围装饰。一并删除。否决。
- **保留 button/input 硬编码 box-shadow**：硬阴影是 neobrutalism 才有的视觉语言，唐风墨染不是；硬编码破坏 token-driven 一致性。否决（D21/D22）。
- **保留 #root border + box-shadow**：ghost card 反模式；DSH Web GUI 全屏沉浸布局不该"窗口化"。否决（D24）。
- **不引入烫金箔**（craft-floor 默认反对）：用户明确选择引入——唐风墨染的烫金箔是其核心辨识度，brief 优先于 craft-floor 默认。通过限制应用范围（仅 h1-h4）+ `@supports` 兜底 + gradient 色标最暗点达 AA 来缓解。否决 craft-floor 默认，引入（D25）。

### Seam（测试接入点，已与用户确认）

| # | Seam | 类型 | 说明 |
| --- | --- | --- | --- |
| S1 | `packages/skins/jiangxiao/tests/apply.spec.ts` | 已有 seam 扩展 | apply/dispose 契约 + token 存在性。apply 后断言：body 有 `data-dsh-jiangxiao`、head 有一个 `data-skin-chrome=fontface` style、body 无 `.jiangxiaoTitlebar`/`.jiangxiaoStatusbar` 子元素、head 无 favicon link、document.title 未被覆盖、CSS 含 `--jx-text-gold` 定义、`--dsw-alias-brand-text` 映射到 `var(--jx-text-gold)`、含 `@supports (background-clip: text)` 规则。dispose 后全部回收。 |
| S2 | `scripts/check-jiangxiao-contrast.mjs` | 新建 seam | 构建时对比度门禁。解析 `jiangxiao.module.css` 中 `--jx-text-*`/`--jx-surface-*` 字面量（深浅双套），按 WCAG 对比度公式校验：`--jx-text-strong`/`--jx-text-base`/`--jx-text-gold` 在 `--jx-surface-0`/`-1`/`-2`/`-3` 上达 4.5:1；`--jx-text-weak`/`--jx-text-faint` 达 3:1。接入 `pnpm test:scripts`。 |

皮肤侧不引入像素级视觉回归 seam（本仓无截图基础设施，且 S1 已做 DOM 契约断言）。

## 测试决策

- **好测试的标准**：只测外部行为，不测实现细节。S1 测 apply() 后 DOM 可观察状态（属性、子元素、style 标签、未覆盖 title）与 dispose 完整回收；S2 测 CSS token 字面量经 WCAG 公式计算的对比度数值，不测 CSS 写法。
- **被测模块**：皮肤 apply/dispose（S1）、`jiangxiao.module.css` token 字面量（S2）。
- **测试先例**：
  - S1 沿用本仓所有皮肤包的 `tests/apply.spec.ts` 模式（jsdom + DOM 断言，参照 `packages/skins/miku/tests/apply.spec.ts`、`packages/skins/xp/tests/apply.spec.ts`）。
  - S2 沿用 `scripts/aggregate.test.mjs`、`scripts/gallery-build` 等构建时校验脚本模式（纯 Node、零依赖、解析源文件 + 断言一致性）。
- **CI**：`pnpm test`（含 S1）+ `pnpm test:scripts`（含 S2）门禁必须保持绿色；`pnpm docs:check` 必须（README 同步）保持绿色。

## 超出范围

- 不改宠物（dsh-pet）、不改其他皮肤、不改 DSH 源码。
- 不引入像素级视觉回归测试基础设施。
- 不回写 openCodeMM 源仓库（两项目独立）。
- 不重构 token 命名或三层 remap 结构（只改字面量值 + 新增 `--jx-text-gold`）。
- 不改 `01-jiangxiao` 已落地的字体策略（2 个 woff2 内联）、不改资产分发形态。
- 不改皮肤包的 cordis patch / bundle 形态。
- 不新增远程 issue tracker。
- 不替换 `preview/light.png` / `dark.png`（若有截图条件可后续单独 pass 替换；本轮保留 placeholder）。

## 补充说明

- 本轮是 `01-jiangxiao` 的延续，同一皮肤包 `jiangxiao` 的二次打磨；不创建新包、不改 `skin.json` 的 id/name/order。
- `01-jiangxiao` 的 D1-D14 决策继续生效；本轮 D15-D25 是叠加而非取代。
- ADR-0001 与 ADR-0002 并存，ADR-0002 不修正 ADR-0001 的任何决策（D1-D14 不变）。
- 双语文档纪律：皮肤包 README 中英配对必须同步更新，`pnpm docs:write-pair` 重新录 hash。
- `packages/skins/jiangxiao/CHANGELOG.md` 追加本次变更记录。
- 实施完成后建议运行 `node c:\Users\jxc123\.trae-cn\skills\impeccable\scripts\detect.mjs --json packages/skins/jiangxiao/src/client/jiangxiao.module.css packages/skins/jiangxiao/src/client/index.ts` 跑一次 impeccable 机械检测器，作为最后的质量门。
