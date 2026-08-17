# ADR-0001: 姜晓·墨染 皮肤与姜晓动画宠物（grill-with-docs 决议）

状态：已定稿（2026-08-17，grill-with-docs 逐项确认）

## 背景

用户要求用 `E:\work\sp\openCodeMM` 的姜晓·墨染魔改主题与素材，在 dsh-web-ui 中：

1. 做一个浅/深双主题皮肤；
2. 用姜晓角色动画替换现有鲸鱼娘宠物。

关键事实（探索确认）：

- openCodeMM 主题天然是"一个主题、深浅双套令牌"（`html[data-theme="jiangxiao"]` +
  `[data-color-scheme="light"]` 变体），6 分包 609 处 `--jx-*` 引用，纯 CSS 落地。
- 姜晓角色素材为 46 个独立 WebP 动画（10 循环态 + 36 过渡），透明底 9:16，
  15fps，`<img>` 播放，状态机驱动。与 dsh-pet 的 spritesheet 切帧模型不兼容。
- dsh-pet 渲染模型：单一 atlas，192×208 单元格 8 列 × 9 行，固定 9 态行序；
  `~/.codex/pets` 自定义宠物通道现成（registry 自动扫描）。
- webp 二次压缩无收益（实测 idle.webp 5523KB → gzip 5522KB，ratio≈1.0）。
- 主题本身无大图片（CSS 令牌 + 内联 SVG），唯一资产是 2 个 woff2 字体
  （mashanzheng 1.64MB + notoserifsc 1.38MB ≈ 3MB）。
- DSH 深色信号为 `body[data-ds-dark-theme]`（xp/git-graph 同款用法）。

## 决策

| 编号 | 决策 |
| --- | --- |
| D1 | 单皮肤包 `packages/skins/jiangxiao/`，深色默认、浅色变体，运行时跟随系统/DSH 主题自动切换。 |
| D2 | 扩展 dsh-pet 渲染层支持"独立 WebP 动画宠物"新类型；姜晓作为新宠物注册，鲸鱼娘保留可选。 |
| D3 | 全量 46 WebP（不丢弃、不降采样），独立资产包分发 + gating：导入后姜晓才出现在宠物选择器。 |
| D4 | 提供 UI 入口让用户指定本地资产包文件；host 解压到 `~/.codex/pets/jiangxiao/`。 |
| D5 | 入口放 dsh-pet `PetSettingsCard` 的通用"导入资产包…"按钮；皮肤卡只做提示。 |
| D6 | zip 格式 + `fflate` 解压（纯 JS 零依赖、树摇友好、host 端不经 shell）。 |
| D7 | `kind: "animated-webp"` 新类型，完整纳入 10 循环态 + 36 过渡态；渲染层移植 openCodeMM 枢纽制过渡（ADR-013 §2）：以待机为枢纽，`idle→X` 正放 + `X→idle` 倒放。 |
| D8 | pet 动画 → 姜晓循环态映射已定（idle→idle、running→thinking、running-right→working、review→replying、waiting→listening、jumping→done、failed→error、running-left→idle、waving→welcome）。过渡：枢纽制查表（直达 1 段 / 经 idle 中转 2 段 / 无素材 crossfade 兜底），快速连续切换用"播放 key 作废"打断。 |
| D9 | token 级移植：`--jx-*` → dsh 三层 token（`--dsw-static-*`/`--dsw-alias-*`/`--aion-*`）；浅色 = `body[data-dsh-jiangxiao]:not([data-ds-dark-theme])`，深色 = `body[data-dsh-jiangxiao][data-ds-dark-theme]`。装饰级（印章发送钮、标题栏纹样、favicon、金线）按 openCodeMM chrome/session 选择性移植。 |
| D10 | 内置 2 个 woff2 字体到皮肤包，离线可用，`@font-face` 保留 local() 回退链。 |
| D11 | 皮肤保持单 bundle：CSS 打进 `lib/client.js`（css-module）；字体 base64 内联进 art 模块（miku 模式），经 `/api/skin-center/bundle/<id>` 单文件 serve；try-on 与运行时同源。角色 webp 走 dsh-pet 资产通道。 |

## 后果

- 皮肤 client.js 约 +4MB（字体 base64 放大 1.33×），可接受。
- dsh-pet 增加新渲染路径 + fflate 依赖，需更新 manifest 契约与 registry 校验。
- 动画状态机复杂度提升（枢纽制过渡 + 播放 key 作废），但可整体移植 openCodeMM 既有实现。
- 资产包 gating 需在皮肤设置卡与宠物设置卡间保持文案一致。

## 待实施工作（后续任务）

1. 姜晓皮肤包：token remap + 深浅变体 + 装饰 + 字体内联。
2. dsh-pet webp 动画宠物：manifest 新类型 + registry 校验 + `PetSprite` 分流渲染
   + 枢纽制过渡状态机。
3. 资产包导入：`PetSettingsCard` 入口 + host fflate 解压路由 + zip 内校验。
4. 资产包产物：46 webp + `pet.json` 打包规范 + 文档。
5. 双语文档与 README 更新（docs 门禁）。
