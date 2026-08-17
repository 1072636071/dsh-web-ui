# ADR-0002: 姜晓皮肤 chrome 瘦身与颜色重设计（grill-with-docs 决议）

状态：已定稿（2026-08-17，grill-with-docs 第二轮逐项确认）

## 背景

ADR-0001 实施后，用户反馈姜晓皮肤两个问题：

1. **"搬运的姜晓皮肤太僵硬了，DSH 没有最上面的工具栏。DSH 没有的不要搬运"**
   - 探查发现：apply() 额外渲染了两条固定 chrome 条——`.jiangxiaoTitlebar`
     （`position: fixed; top: 0; height: 30px`，带印章 + 唐风标题 + 窗口按钮
     `-` `□` `×`）和 `.jiangxiaoStatusbar`（`position: fixed; bottom: 0; height: 28px`，
     带朱砂点 + 状态单元"墨染/楷宋就绪/已连接/在线/唐风正式版"）。
   - DSH Web GUI 没有这两条元素：DSH 自己的 titlebar 是 `header[data-slot='titlebar-v2']`
     （姜晓皮肤 CSS 第 736-774 行已美化），不需要另叠一条。
   - openCodeMM 原作 `jiangxiao/chrome.css` 也不注入这两条——它只美化 DSH/openCodeMM
     已有 DOM（body 背景、`[data-slot='titlebar-v2']`、滚动条、selection、headings），
     不新建元素。openCodeMM 全文无 statusbar。
   - 结论：两条 chrome 条属"DSH 没有的、openCodeMM 也没有的"过度搬运，违反
     "DSH 没有的不要搬运"原则。

2. **"界面还有对比颜色，也要重新设计一款，现在看起来太怪了。浅色和深色都要全部重新设计"**
   - 对比度分析（WebAIM 估算）暴露的问题：
     - 浅色 `--jx-text-weak` `#8d7a70` on `#faf5ee`：3.0:1 ✗ 严重不足
     - 浅色 `--jx-text-faint` `#b3a296`：1.8:1 ✗ 几乎不可读
     - 浅色 `--jx-gold` `#b8860b`：4.0:1 ✗ 低于 AA
     - 浅色 `--jx-cinnabar` `#b24a5c`：3.2:1 ✗ 不足
     - 深色 `--jx-gold-dim` `#996515`：4.0:1 ✗ 低于 AA
     - 深色 `--jx-text-weak` 在 surface-3 `#2d242f` 上：4.2:1 ✗ AA 边界
   - 根因：dsh-web-ui 姜晓皮肤直接搬运了 openCodeMM 的 `--jx-*` 字面量，remap 到
     DSH 三层 token（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`），DSH 所有读
     token 的组件都继承了这些对比度问题。openCodeMM 原作对比度不足是其自身设计缺陷。

## 决策

| 编号 | 决策 |
| --- | --- |
| D15 | 删除 apply() 渲染的 `.jiangxiaoTitlebar` 和 `.jiangxiaoStatusbar` 两条固定 chrome 条，及附属配置面（`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG`）。 |
| D16 | 装饰级切分对齐 openCodeMM `chrome.css` 范围。**保留**：token remap、@font-face 字体、body 背景纹理（云纹 radial-gradient）、`[data-slot='titlebar-v2']` 美化、滚动条金线、::selection、headings 楷体烫金（D25 烫金箔）、strong/b 亮金、:focus-visible outline。**删除**：两条 chrome 条、印章发送钮（`[data-action='prompt-submit']` 朱砂印章化）、favicon 注入、document.title 覆盖、button/input 硬编码 box-shadow（D21/D22）、body padding（D23）、#root border/shadow（D24）。 |
| D17 | 按唐风墨染设计哲学为 DSH 重新设计 `--jx-*` 字面量，深浅双套全部重做。约束：WCAG AA（4.5:1 正文、3:1 大字/图标/装饰）。只改 dsh 侧 `jiangxiao.module.css`，不回写 openCodeMM（两项目独立，设计哲学一致但色值分叉）。保持 token 名字和三层 remap 结构不变。 |
| D18 | gold 族拆分：新增 `--jx-text-gold`（文字用，深色 `#d6b34a`、浅色 `#8a6508`，达 AA），`--jx-gold` 语义收窄为装饰专用。`--dsw-alias-brand-text` 映射到 `--jx-text-gold`，装饰 token 映射到 `--jx-gold`。 |
| D19 | 浅色 cinnabar/seal 加深为深梅红（如 `#8e3a49` 或更深），让点缀色在浅底上达 AA。保持"梅花"语义但向"梅红"靠拢。 |
| D20 | 新增 `scripts/check-jiangxiao-contrast.mjs` 对比度 CI 门禁，校验 `--jx-text-*` 在 `--jx-surface-*` 上的对比度达 AA，接入 `pnpm test:scripts`。 |
| D21 | 删除 `button` / `button:hover` / `button:active` 的硬编码 `box-shadow` + `background-image: none`。DSH 原生按钮视觉由 `--dsw-alias-button-*-fill` / `*-hover` token 决定；硬编码阴影是拟物硬塞，破坏 token-driven 一致性；唐风墨染不是 neobrutalism，craft-floor 反对硬阴影。 |
| D22 | 删除 `input` / `textarea` / `select` 的硬编码 `box-shadow` + `background` + `color`。同 D21：DSH 输入框由 `--dsw-specific-input-major` 等 token 决定，硬编码是装饰性越权。 |
| D23 | 删除 `body[data-dsh-jiangxiao]` 的 `padding: 34px 8px 32px`。这是为两条 chrome 条腾位的残留，D15 删 chrome 条后失去动机。openCodeMM chrome.css 无 body padding，DSH 原生 body 也不该有 padding。 |
| D24 | `body[data-dsh-jiangxiao] [id='root']` 删除 `border` + `box-shadow`，保留 `background: transparent`。border + wide soft shadow 是 craft-floor 反对的 ghost card 反模式；openCodeMM chrome.css 只透明化不加边框；DSH Web GUI 全屏沉浸布局不该"窗口化"。 |
| D25 | 引入 `background-clip: text` 烫金箔应用于 `h1, h2, h3, h4`（对齐 openCodeMM chrome.css 第 298-311 行）。`@supports` 兜底回退到 `--jx-text-gold` 纯色。D17 重设计 `--jx-gold-foil` gradient 色标时确保最暗点对 surface-0 达 AA 4.5:1。**不应用**到 `strong/b` 或小字号位置。覆盖 craft-floor "gradient text" 反对——唐风墨染的烫金箔是其核心辨识度，brief 优先。标题 `letter-spacing` 从 `0.02em` 收紧到 `0.01em`。 |

## 被否决的替代方案

- **保留 chrome 条只改样式**：违反"DSH 没有的不要搬运"原则，且两条固定条与 DSH
  已有 `header[data-slot='titlebar-v2']` 重叠僵硬。否决。
- **同步回写 openCodeMM**：openCodeMM 是独立项目，其对比度问题是自身设计缺陷，
  不是 dsh-web-ui 该修的；且 dsh-web-ui 仓库规则禁止修改 DSH 源码，openCodeMM
  虽非 DSH 源码但跨项目回写超出本仓范围。否决。
- **AAA 7:1 标准线**：调色空间窄，会牺牲唐风氛围（深色 surface 要更黑、浅色文字
  要更深）。AA 4.5:1 已满足 user_profile 的 WCAG accessibility standards 要求。否决。
- **gold 不拆分、加深 `--jx-gold` 兼作文字色**：会失去"亮金"装饰感，
  `gold-bright` / `gold` / `gold-deep` 三阶退化为两阶。拆分后文字与装饰各取所需。否决。
- **只删顶部条、保留 statusbar**：底部状态栏 DSH 和 openCodeMM 都没有，且
  "墨染/楷宋就绪/已连接/在线/唐风正式版"是模拟窗口 chrome 的氛围装饰，非 DSH
  原生 UI。一并删除。否决。
- **保留 button/input 硬编码 box-shadow**（impeccable 审查时考虑）：硬阴影是
  neobrutalism 才有的视觉语言，唐风墨染不是 neobrutalism；DSH 原生按钮视觉由
  `--dsw-alias-button-*-fill` token 决定，硬编码阴影破坏 token-driven 一致性。
  否决（D21/D22）。
- **保留 #root border + box-shadow**（impeccable 审查时考虑）：border + wide soft
  shadow 是 craft-floor 反对的 ghost card 反模式；DSH Web GUI 全屏沉浸布局不该
  "窗口化"。否决（D24）。
- **不引入烫金箔 background-clip:text**（impeccable craft-floor 默认反对）：
  用户明确选择引入——唐风墨染的烫金箔是其核心辨识度，brief 优先于 craft-floor
  默认。通过限制应用范围（仅 h1-h4）+ `@supports` 兜底 + gradient 色标最暗点达 AA
  来缓解 craft-floor 的担忧。否决 craft-floor 默认，引入（D25）。

## 后果

- apply() 简化：从"注入两条 chrome 条 + favicon + title + 字体 + body 属性"
  缩减为"字体 + body 属性"。chrome 相关代码（约 100 行 TS + 120 行 CSS）删除。
- `localStorage` 配置面 `dsh.jiangxiao.title` / `dsh.jiangxiao.cells` 移除，
  README 配置章节同步删除。
- `--jx-*` token 字面量全部重算，深浅双套各约 40 个 token。remap 到 DSH 三层
  token 的映射关系保持不变（除 `--dsw-alias-brand-text` 改映射到 `--jx-text-gold`）。
- 印章发送钮 `[data-action='prompt-submit']` 的朱砂化样式删除，DSH 原生发送钮
  外观恢复（由 token 决定颜色，不再强制圆角化/红边/红阴影）。
- favicon 不再注入，DSH 原生 favicon 生效。
- document.title 不再覆盖，DSH 的 DocumentTitle 服务全权管理浏览器 tab 标题。
- 新增 `scripts/check-jiangxiao-contrast.mjs` CI 门禁，对比度回退会在
  `pnpm test:scripts` 阶段变红。
- README / README.zh.md / README.i18n.yaml 需同步更新（删除 chrome 条描述、
  配置面章节、favicon/title 描述；新增对比度门禁说明）。

## 待实施工作

1. `packages/skins/jiangxiao/src/client/index.ts`：删除 chrome 条渲染、favicon、
   document.title、SEAL_SVG、TITLEBAR_GLYPHS、STATUS_CELLS、LS_TITLE、LS_CELLS、
   resolveTitle、resolveCells、SKIN_TITLE；apply() 仅保留 body 属性 + 字体注入 +
   locale 注册 + settings section 注册。
2. `packages/skins/jiangxiao/src/client/jiangxiao.module.css`：
   - 删除 `.jiangxiaoTitlebar*` / `.jiangxiaoStatusbar*` 全部 class 规则。
   - 删除 `[data-action='prompt-submit']` 印章化规则（第 698-728 行）。
   - 删除 `button` / `button:hover` / `button:active` 硬编码 box-shadow（第 593-618 行）。
   - 删除 `input` / `textarea` / `select` 硬编码 box-shadow + background + color（第 620-634 行）。
   - 删除 `body[data-dsh-jiangxiao]` 的 `padding: 34px 8px 32px`（第 145 行）。
   - `#root` 删除 `border` + `box-shadow`，保留 `background: transparent`（第 159-169 行）。
   - 重设计 `--jx-*` 字面量（深浅双套），让 `--jx-text-*` 在 `--jx-surface-*` 上
     达 WCAG AA 4.5:1，`--jx-text-faint` 达 3:1。
   - 新增 `--jx-text-gold` token（深浅双套），`--dsw-alias-brand-text` 改映射到它。
   - 浅色 `--jx-cinnabar` / `--jx-seal` 加深为深梅红（如 `#8e3a49` 或更深）。
   - 浅色 `--jx-wisteria`（visited 链接色）加深到 AA。
   - `--jx-gold-foil` gradient 色标重设计，确保最暗点对 surface-0 达 AA 4.5:1。
   - 新增 `h1-h4` 烫金箔规则：`@supports (background-clip: text)` + 不支持时回退到
     `--jx-text-gold` 纯色；`letter-spacing: 0.01em`。
3. `packages/skins/jiangxiao/tests/apply.spec.ts`：更新契约测试，移除 chrome 条
   断言，新增 `--jx-text-gold` token 存在性断言。
4. `scripts/check-jiangxiao-contrast.mjs`：新增对比度校验脚本，解析
   `jiangxiao.module.css` 中的 `--jx-text-*` / `--jx-surface-*` 字面量，按 WCAG
   对比度公式校验，接入 `pnpm test:scripts`。
5. `packages/skins/jiangxiao/README.md` / `README.zh.md` / `README.i18n.yaml`：
   删除 chrome 条描述、Configuration 章节的 title/cells 配置面、favicon/title
   描述；新增对比度门禁说明；重新 `pnpm docs:write-pair` 录配对。
6. `packages/skins/jiangxiao/CHANGELOG.md`：追加本次变更记录。
7. `packages/skins/jiangxiao/preview/light.png` / `dark.png`：重设计后重新截图
   替换 placeholder（若有截图条件；否则保留 placeholder 待后续截图 pass）。
