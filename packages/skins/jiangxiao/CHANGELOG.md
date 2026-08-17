# Changelog

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

## 0.1.0 — Initial Jiangxiao · Ink-Dyed skin

### Added
- Tang-style anime skin package `jiangxiao`: dark default "Moonlit Ink-Dyed" (ink-black ground, dark-gold text, mist-purple atmosphere, cinnabar accent) + light variant "Plum Blossom" (rice-white ground, pink plum, gold), following the DSH dark/light signal automatically
- Token-level port: `--jx-*` token semantics remapped onto the dsh three-layer tokens (`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`)
- Decorative layer: cinnabar seal send button, title-bar Tang cloud pattern with gold end-rule, gold scrollbar, jiangxiao favicon, document title
- Two woff2 fonts inlined (Ma Shan Zheng kaiti + Noto Serif SC song), base64-embedded in the art module, `@font-face` carries local() fallback chains, offline-capable
- Code blocks / syntax highlighting keep the upstream `--syntax-*` palette untouched
- `prefers-reduced-motion` disables all motion
- Bilingual README trio (README.md + README.zh.md + README.i18n.yaml)