# CONTEXT.md — 词汇表

本仓库的领域术语与决策词汇。技术值不译；术语一经确定立即登记，避免后续讨论
基于过时定义。

## 主题与皮肤

| 术语 | 定义 |
| --- | --- |
| 姜晓·墨染（Jiangxiao · Ink-Dyed） | 源自 `E:\work\sp\openCodeMM` 的唐风二次元设计系统：墨黑为底、暗金为文、雾紫为氛、朱砂点睛。设计源文件为 openCodeMM 根目录 `DESIGN.md`，`--jx-*` 令牌块（§10 附录）为其唯一落地形式。 |
| jiangxiao 皮肤（本项目形态） | dsh-web-ui 皮肤包 `packages/skins/jiangxiao/`：深色为默认、浅色为变体，单包承载深浅双套令牌，运行时跟随系统/DSH 主题自动切换（决策 A，2026-08-17 grill-with-docs）。 |

## 渲染模型

| 术语 | 定义 |
| --- | --- |
| spritesheet 切帧宠物（dsh-pet） | 宠物渲染模型：单一 atlas 图，192×208 单元格、8 列 × 9 行，固定 9 态行序（idle/running-right/running-left/waving/jumping/failed/waiting/running/review）。`pet.json` + atlas 注册即可新增宠物。 |
| 独立 WebP 动画角色（openCodeMM） | 姜晓角色素材：46 个独立 WebP（10 循环态 + 36 过渡），透明底 9:16，15fps，`<img>` 播放，状态机驱动。与 spritesheet 切帧模型不兼容，不能直接塞进 pet.json。 |
| webp 二次压缩无收益（实测） | 姜晓素材 `idle.webp` 5523KB，gzip -9 后 5522KB（ratio≈1.0）。webp 帧内熵编码已近最优，zstd/gzip 二次压缩不会显著减小体积。"压缩归档"只解决文件管理与分发形态，不解决包体体积。 |

## 已定决策（grill-with-docs 2026-08-17）

### 深浅切换信号（实施约束）

| 术语 | 定义 |
| --- | --- |
| DSH 深色标记 | `body[data-ds-dark-theme]`：DSH 官方深色信号（xp/git-graph 等皮肤同款用法）。姜晓皮肤浅色变体选择器 = `body[data-dsh-jiangxiao]:not([data-ds-dark-theme])`（或等价反转），深色 = `body[data-dsh-jiangxiao][data-ds-dark-theme]`。openCodeMM 的 `html[data-theme="jiangxiao"][data-color-scheme="light"]` 两套令牌映射到这两个选择器。 |

| 决策 | 内容 |
| --- | --- |
| D1 皮肤形态 | 单皮肤包 `jiangxiao` 承载深浅双套令牌，运行时跟随系统/DSH 主题自动切换（选项 A）。 |
| D2 宠物渲染路径 | 扩展 dsh-pet 渲染层支持"独立 WebP 动画宠物"新类型；姜晓作为 built-in pet 注册，鲸鱼娘保留可选（选项 A）。 |
| D3 素材策略 | 全量 46 个 WebP 素材（不丢弃、不降采样），**独立资产包分发 + gating**：用户导入资产包后姜晓宠物才出现在宠物选择器，未导入则不出现（选项 C1 + B 变体）。webp 二次压缩无收益，不做压缩归档。 |
| D4 资产包导入 | 提供 UI 入口让用户**指定本地资产包文件**（选项 B 变体）；host 端解压到 `~/.codex/pets/jiangxiao/`，registry 自动识别。分发渠道 = 手动指定文件，不做下载按钮。 |
| D5 导入入口位置 | dsh-pet 的 `PetSettingsCard` 宠物选择器旁放通用"导入资产包…"按钮；姜晓皮肤只在设置卡提示"下载姜晓动画包后可用"（选项 A）。 |
| D6 资产包格式与解压 | zip 格式 + `fflate` 库解压（选项 A）。纯 JS 零依赖、树摇友好、host 端不经 shell，跨平台无坑。 |
| D7 webp 动画 manifest 与渲染 | `kind: "animated-webp"` 新类型，**完整纳入 10 循环态 + 36 过渡态**（选项 B）：渲染层做完整状态机播放过渡动画，移植 openCodeMM 枢纽制过渡（ADR-013 §2）——以待机为枢纽，`idle→X` 正放 + `X→idle` 倒放，前端按过渡表查路径播放。 |
| D8 动画映射与过渡策略 | pet 动画 → 姜晓循环态映射已定：idle→idle、running→thinking、running-right→working、review→replying、waiting→listening、jumping→done、failed→error、running-left（保留位）→idle、waving（保留位）→welcome。过渡播放：枢纽制查表（直达 1 段 / 经 idle 中转 2 段 / 无素材 crossfade 兜底），快速连续切换用"播放 key 作废"机制打断旧过渡。 |
| D9 皮肤 CSS 形态 | **token 级移植**（选项 A）：把 `--jx-*` 令牌语义映射到 dsh 三层 token（`--dsw-static-*`/`--dsw-alias-*`/`--aion-*`），深色默认 + `body[data-dsh-jiangxiao][data-ds-dark-theme]` 浅色变体，天然支持深浅跟随；装饰级（印章发送钮、标题栏纹样、favicon、金线）按 openCodeMM chrome/session 选择性移植。 |
| D10 字体策略 | **内置字体到皮肤包**（选项 A）：两个 woff2（mashanzheng 1.64MB + notoserifsc 1.38MB ≈ 3MB）作为皮肤 assets 入库，构建打进皮肤包，离线可用；`@font-face` 保留 local() 回退链。 |
| D11 资产分发形态 | 皮肤保持单 bundle 架构：CSS 经 tsdown 打进 `lib/client.js`（css-module，`<style data-plugin>` 注入）；字体作为 base64 data URL 内联进 art 模块（沿用 miku 的 `MIKU_ART` 模式），经 `/api/skin-center/bundle/<id>` 单文件 serve；try-on 与运行时同源。代价：字体 base64 放大 1.33×，client.js +4MB（可接受）。角色 webp 不走皮肤 bundle，走 dsh-pet 资产通道（`~/.codex/pets`）。 |
| D12 素材源持有（D2 修正） | 素材源放**本地项目** `local-assets/jiangxiao-pet/`（46 webp，232MB，gitignore 不上库）；打包脚本 `scripts/pack-jiangxiao-pet.mjs` 引用该目录；`hash-manifest.json`（46 文件 sha256 + 字节数 + zip sha256）进仓作为不可变版本清单。zip 挂 GitHub release 资产（复用 release.yml 上传链路）。CI 柔性门禁：脚本 `--check` 校验任意 zip 与清单一致，不强制 CI 从零构建。 |
| D13 过渡态打包范围（D3 修正） | 36 个过渡文件**全部打包**（素材完整性），渲染层过渡表**只索引 pet 可达的 10 态间路径**；涉及微表情态端点（cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave）与 pet 不可达态（permission/reading）的过渡文件保留在包中、不进渲染层过渡表、不参与调度。 |
| D14 边界场景定案（D1 修正） | 重复导入：目标目录已存在时**拒绝导入**并提示"动画包已存在，请先删除旧目录再导入"；删除热移除：registry 为启动时快照，删除目录需**重启生效**，不做文件 watcher；webp 加载策略：**按需拉取当前状态文件 + 切换时预取目标态**，加载完成前占位 fade-in。 |

## 已定决策（grill-with-docs 2026-08-17 第二轮：chrome 瘦身与颜色重设计）

### 装饰级切分原则

| 术语 | 定义 |
| --- | --- |
| openCodeMM chrome.css 范围 | openCodeMM `jiangxiao/chrome.css` 只美化 DSH 已有 DOM（body 背景、`[data-slot='titlebar-v2']`、滚动条、::selection、headings），**不注入新元素**。这是姜晓皮肤装饰级移植的边界基准：chrome.css 有的才留，没有的 DOM 注入装饰全删。 |
| DSH 已有 DOM | DSH Web GUI 自身渲染的元素：`body`、`#root`、`header[data-slot='titlebar-v2']`、按钮、输入框、滚动条等。皮肤通过 CSS 美化这些元素属"token 级/装饰级 CSS"，不算"DOM 注入"。 |
| DOM 注入式装饰 | apply() 用 `document.createElement` 新建并插入 body 的元素：`.jiangxiaoTitlebar`（顶部固定条）、`.jiangxiaoStatusbar`（底部固定条）、`<link rel='icon'>`（favicon）、`document.title` 覆盖。DSH 没有这些元素，openCodeMM chrome.css 也不注入——属过度搬运，全删。 |

### gold 族语义拆分

| 术语 | 定义 |
| --- | --- |
| `--jx-text-gold`（新增） | 文字专用金：深色 `#d6b34a`、浅色 `#8a6508`，在对应 surface-0 上达 WCAG AA 4.5:1。`--dsw-alias-brand-text` 映射到此 token，用于链接、强调文字、tab-title 等。 |
| `--jx-gold`（语义收窄） | 装饰专用金：保留原色相（深色 `#d6b34a`、浅色 `#b8860b`），用于边框、图标背景、渐变、滚动条等非文字位置。作文字色时对比度可能不足，禁止用于 `color` 属性。 |

| 决策 | 内容 |
| --- | --- |
| D15 chrome 条删除 | 删除 apply() 渲染的 `.jiangxiaoTitlebar`（顶部固定条）和 `.jiangxiaoStatusbar`（底部固定条）及附属配置面（`TITLEBAR_GLYPHS` / `STATUS_CELLS` / `LS_TITLE` / `LS_CELLS` / `resolveTitle` / `resolveCells` / `SEAL_SVG`）。两条 chrome 条 DSH 和 openCodeMM 原作都没有，违反"DSH 没有的不要搬运"原则。 |
| D16 装饰级切分 | 对齐 openCodeMM chrome.css 范围。**保留**：token remap、@font-face 字体、body 背景纹理（云纹 radial-gradient）、`[data-slot='titlebar-v2']` 美化、滚动条金线、::selection、headings 楷体烫金（D25 烫金箔）、strong/b 亮金、:focus-visible outline。**删除**：两条 chrome 条、印章发送钮（`[data-action='prompt-submit']` 朱砂印章化，用户明说"发送按钮也不改了"）、favicon 注入、document.title 覆盖、button/input 硬编码 box-shadow（D21/D22）、body padding（D23）、#root border/shadow（D24）。 |
| D17 颜色重设计 | 按唐风墨染设计哲学（墨黑/米白 surface + 金族 + 朱砂/梅红 seal + 雾紫氛围）为 DSH 重新设计 `--jx-*` 字面量，深浅双套全部重做。约束：WCAG AA（4.5:1 正文、3:1 大字/图标/装饰）。只改 dsh 侧 `jiangxiao.module.css`，不回写 openCodeMM（两项目独立，设计哲学一致但色值分叉）。保持 token 名字和三层 remap 结构不变。 |
| D18 gold 族拆分 | 新增 `--jx-text-gold`（文字用，深色 `#d6b34a`、浅色 `#8a6508`，达 AA），`--jx-gold` 语义收窄为装饰专用。`--dsw-alias-brand-text` 映射到 `--jx-text-gold`，装饰 token 映射到 `--jx-gold`。 |
| D19 浅色点缀色加深 | 浅色 cinnabar/seal 加深为深梅红（如 `#8e3a49` 或更深），让 `--jx-cinnabar` / `--jx-seal` 在浅底上达 AA 4.5:1。保持"梅花"语义但向"梅红"靠拢。 |
| D20 对比度 CI 门禁 | 新增 `scripts/check-jiangxiao-contrast.mjs`，校验 `--jx-text-*` 在 `--jx-surface-*` 上的对比度达 AA（4.5:1 正文、3:1 faint/装饰），接入 `pnpm test:scripts`。防止后续改动回退对比度。 |
| D21 button box-shadow 删除 | 删除 `button` / `button:hover` / `button:active` 的硬编码 `box-shadow` + `background-image: none`（第 593-618 行）。DSH 原生按钮视觉由 `--dsw-alias-button-*-fill` / `*-hover` token 决定，token remap 后已够；硬编码 `rgba(5,3,8,...)` 阴影是拟物硬塞，破坏 token-driven 一致性；唐风墨染不是 neobrutalism，craft-floor 反对硬阴影。 |
| D22 input 硬编码样式删除 | 删除 `input` / `textarea` / `select` 的硬编码 `box-shadow` + `background` + `color`（第 620-634 行）。同 D21：DSH 输入框由 `--dsw-specific-input-major` 等 token 决定，硬编码 inset 阴影 + 直接覆盖 background/color 是装饰性越权。 |
| D23 body padding 删除 | 删除 `body[data-dsh-jiangxiao]` 的 `padding: 34px 8px 32px`（第 145 行）。这是为两条 chrome 条腾位的残留，D15 删 chrome 条后失去动机。openCodeMM chrome.css 无 body padding，DSH 原生 body 也不该有 padding（布局壳管）。 |
| D24 #root 边框阴影删除 | `body[data-dsh-jiangxiao] [id='root']` 删除 `border` + `box-shadow`，保留 `background: transparent`。border + wide soft shadow 是 craft-floor 反对的 ghost card 反模式；openCodeMM chrome.css 只透明化不加边框；DSH Web GUI 全屏沉浸布局不该"窗口化"。 |
| D25 烫金箔引入 | 引入 `background-clip: text` 烫金箔应用于 `h1, h2, h3, h4`（对齐 openCodeMM chrome.css 第 298-311 行）。`@supports` 兜底：不支持时回退到 `--jx-text-gold` 纯色。D17 重设计 `--jx-gold-foil` gradient 色标时确保最暗点对 surface-0 达 AA 4.5:1。**不应用**到 `strong/b` 或小字号位置（避免小尺寸 gradient text 糊）。覆盖 craft-floor "gradient text" 反对——唐风墨染的烫金箔是其核心辨识度，brief 优先。标题 `letter-spacing` 从 `0.02em` 收紧到 `0.01em`。 |
