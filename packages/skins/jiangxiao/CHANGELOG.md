# Changelog

## 未发布 — 对齐 skin-preview 设计（墨金卷轴银杏 / 宣纸梅花）

### 新增
- 角色浮层金色发光背光：drop-shadow 光晕勾勒角色轮廓 + radial 呼吸光晕层（`data-jx-backlight`），跟随 fx-breathe 开关与 prefers-reduced-motion
- 令牌对齐 `.scratch/skin-preview/tokens.css`：新增代码语法（code-bg/code-border/kw/str/fn/cmt/num）、petal-1/2/3、poem-color、ink-glow、动效时长（breathe/gold-rotate/shimmer/leaf-fall-min/max/seal-pulse/bpulse）、radius-seal、布局（sidebar-w/files-w）令牌族
- 代码块唐风包边：pre 元素应用 `--jx-code-bg` / `--jx-code-border` / 圆角
- 台词气泡升级为金边楷书质感（对齐 demo）

### 变更
- FX 视觉对齐原型：fall 收敛为 8 片独立飘片（CSS keyframes，translate3d GPU 合成，18-28s 各异轨迹），grain 改为静态多层 radial 墨晕零热循环；各效时长走令牌
- 文字金归并：`--dsw-alias-brand-text` 与 h1-h4 改用 `--jx-gold`（深）/ `--jx-gold-dim`（浅）；对比度门禁同步按变体校验金族文字令牌
- visited 链接色改用 seal/梅红族

### 删除
- 未被设计引用的氛围族令牌 mist/mountain/water/cloud/moon/hair、`--jx-text-gold`、`--jx-wisteria`、`--jx-hl-file` / `--jx-hl-agent`
- fall 的 WAAPI 12 片实现与 `fx-fall-waapi` 降级标记；grain 的 SVG turbulence 实现

## 0.2.0 — chrome 瘦身与颜色重设计

### 新增
- `--jx-text-gold` 文字专用金 token（深浅双套），`--dsw-alias-brand-text` 改映射到它；`--jx-gold` 收窄为装饰专用（边框、图标背景、渐变、滚动条）
- h1-h4 烫金箔：`background-clip: text` + `--jx-gold-foil` 渐变，`@supports` 兜底回退 `--jx-text-gold` 纯色；标题 `letter-spacing` 从 0.02em 收紧到 0.01em
- 对比度 CI 门禁 `scripts/check-jiangxiao-contrast.mjs`：解析 `jiangxiao.module.css` 中深浅双套 `--jx-text-*` / `--jx-surface-*` 字面量，按 WCAG 2.1 校验 AA（正文 4.5:1、弱化文字 3:1），接入 `pnpm test:scripts`

### 变更
- `--jx-*` 字面量深浅双套全部重做达 WCAG AA：深色 `--jx-text-faint` 加深、`--jx-wisteria` 提亮；浅色 `--jx-text-weak` / `--jx-text-faint` 加深、`--jx-gold-foil` 最暗点加深、`--jx-seal` / `--jx-cinnabar` 加深为深梅红、`--jx-wisteria` 加深
- apply/dispose 契约测试更新：断言不再注入 chrome 条 / favicon / document.title，断言 `--jx-text-gold` token 存在且 `--dsw-alias-brand-text` 映射到它，断言烫金箔 `@supports` 规则存在
- README 双语同步：删除 chrome 条描述与 title/cells 配置面，新增对比度门禁说明与烫金箔描述，装饰层描述对齐 D16

### 删除
- apply() 渲染的两条固定 chrome 条（`.jiangxiaoTitlebar` / `.jiangxiaoStatusbar`）及附属配置面（`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG` / `SKIN_TITLE` / `FAVICON_SVG` / `readOverride`）
- favicon 注入与 document.title 覆盖（交还 DSH 原生）
- 印章发送钮朱砂化（`[data-action='prompt-submit']` 规则），DSH 原生发送钮外观恢复
- button / button:hover / button:active 硬编码 box-shadow + background-image: none
- input / textarea / select 硬编码 box-shadow + background + color
- body padding（`padding: 34px 8px 32px`）与 `#root` border + box-shadow（保留 background: transparent）
- `localStorage` 配置面 `dsh.jiangxiao.title` / `dsh.jiangxiao.cells` 及 README Configuration 章节

## 0.1.0 — 姜晓·墨染皮肤首版

### 新增
- 唐风二次元皮肤包 `jiangxiao`：深色默认「月夜墨染」（墨黑底、暗金文、雾紫氛、朱砂点睛）+ 浅色变体「梅花」（米白底、粉梅、金），跟随 DSH 深浅信号自动切换
- token 级移植：`--jx-*` 令牌语义映射到 dsh 三层 token（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`）
- 装饰级：朱砂印章发送钮、标题栏唐风云纹与金线端饰、金线滚动条、姜晓 favicon、文档标题
- 2 个 woff2 字体内置（Ma Shan Zheng 楷体 + Noto Serif SC 宋体），base64 内联进 art 模块，`@font-face` 含 local() 回退链，离线可用
- 代码块/语法高亮保持 `--syntax-*` 上游配色不改
- `prefers-reduced-motion` 下动效全关
- 双语文档三件套（README.md + README.zh.md + README.i18n.yaml）

---

# Changelog (English)

## Unreleased — aligned with the skin-preview design (Ink-Gold Scroll Ginkgo / Xuan-Paper Plum Blossom)

### Added
- Character overlay gold glow backlight: a drop-shadow halo tracing the character plus a breathing radial glow layer (`data-jx-backlight`), following the fx-breathe toggle and prefers-reduced-motion
- Token alignment with `.scratch/skin-preview/tokens.css`: added code syntax (code-bg/code-border/kw/str/fn/cmt/num), petal-1/2/3, poem-color, ink-glow, motion duration (breathe/gold-rotate/shimmer/leaf-fall-min/max/seal-pulse/bpulse), radius-seal and layout (sidebar-w/files-w) token families
- Tang-framed code blocks: pre elements styled with `--jx-code-bg` / `--jx-code-border` / rounded corners
- Speech bubble restyled as a gold-bordered kaiti look (aligned with the demo)

### Changed
- FX visuals aligned with the prototype: fall converged to 8 independent pieces (CSS keyframes, translate3d GPU compositing, 18-28s distinct trajectories); grain is now a static multi-layer radial ink texture with zero hot loops; effect durations run through tokens
- Gold-as-text consolidated: `--dsw-alias-brand-text` and h1-h4 now use `--jx-gold` (dark) / `--jx-gold-dim` (light); the contrast gate verifies the gold text token per variant
- Visited link color moved to the seal/plum family

### Removed
- Atmosphere tokens not referenced by the design (mist/mountain/water/cloud/moon/hair), `--jx-text-gold`, `--jx-wisteria`, `--jx-hl-file` / `--jx-hl-agent`
- The WAAPI 12-piece fall implementation and the `fx-fall-waapi` fallback marker; the grain SVG turbulence implementation

## 0.2.0 — Chrome trim and color redesign

### Added
- `--jx-text-gold` text-only gold token (dark + light sets); `--dsw-alias-brand-text` now maps to it. `--jx-gold` is narrowed to decorative use (borders, icon backgrounds, gradients, scrollbar).
- Gold-foil h1-h4: `background-clip: text` + `--jx-gold-foil` gradient, with an `@supports` fallback to `--jx-text-gold` solid color. Heading `letter-spacing` tightened from 0.02em to 0.01em.
- Contrast CI gate `scripts/check-jiangxiao-contrast.mjs`: parses the dark + light `--jx-text-*` / `--jx-surface-*` literals in `jiangxiao.module.css`, verifies WCAG 2.1 AA (4.5:1 body text, 3:1 faint text), wired into `pnpm test:scripts`.

### Changed
- `--jx-*` literals fully redesigned across dark + light sets to WCAG AA: dark `--jx-text-faint` deepened, `--jx-wisteria` lightened; light `--jx-text-weak` / `--jx-text-faint` deepened, `--jx-gold-foil` darkest stop deepened, `--jx-seal` / `--jx-cinnabar` deepened to dark plum-red, `--jx-wisteria` deepened.
- apply/dispose contract test updated: asserts no chrome bars / favicon / document.title injection, asserts `--jx-text-gold` token exists and `--dsw-alias-brand-text` maps to it, asserts the gold-foil `@supports` rule is present.
- README bilingual sync: dropped chrome-bar descriptions and the title/cells config surface, added the contrast-gate section and gold-foil description, decorative-layer description aligned with D16.

### Removed
- The two fixed chrome bars rendered by apply() (`.jiangxiaoTitlebar` / `.jiangxiaoStatusbar`) and their config surfaces (`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG` / `SKIN_TITLE` / `FAVICON_SVG` / `readOverride`).
- Favicon injection and document.title override (returned to DSH native).
- Cinnabar seal send-button styling (`[data-action='prompt-submit']` rule); the DSH native send button is restored.
- button / button:hover / button:active hardcoded box-shadow + background-image: none.
- input / textarea / select hardcoded box-shadow + background + color.
- body padding (`padding: 34px 8px 32px`) and `#root` border + box-shadow (background: transparent kept).
- `localStorage` config keys `dsh.jiangxiao.title` / `dsh.jiangxiao.cells` and the README Configuration section.

## 0.1.0 — Initial Jiangxiao · Ink-Dyed skin

### Added
- Tang-style anime skin package `jiangxiao`: dark default "Moonlit Ink-Dyed" (ink-black ground, dark-gold text, mist-purple atmosphere, cinnabar accent) + light variant "Plum Blossom" (rice-white ground, pink plum, gold), following the DSH dark/light signal automatically
- Token-level port: `--jx-*` token semantics remapped onto the dsh three-layer tokens (`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`)
- Decorative layer: cinnabar seal send button, title-bar Tang cloud pattern with gold end-rule, gold scrollbar, jiangxiao favicon, document title
- Two woff2 fonts inlined (Ma Shan Zheng kaiti + Noto Serif SC song), base64-embedded in the art module, `@font-face` carries local() fallback chains, offline-capable
- Code blocks / syntax highlighting keep the upstream `--syntax-*` palette untouched
- `prefers-reduced-motion` disables all motion
- Bilingual README trio (README.md + README.zh.md + README.i18n.yaml)