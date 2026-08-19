# PRD: jiangxiao 皮肤全面改造（对齐 skin-preview 设计）

Status: ready-for-agent

来源：docs/memorial/002-jiangxiao-skin-revamp（已完成 grill，8 项决策 + ADR-0003 + 事件源调查闭环）+ 2026-08-19 设计基准切换决策。设计唯一基准：本仓库 `.scratch/skin-preview/`（`DESIGN.md` 设计文档 + `tokens.css` 设计令牌 + `index.html` 已确认 demo，三者一体）。皮肤视觉目标：墨金卷轴银杏（深）/ 宣纸梅花（浅）双主题、可关的特效系统、金色发光背光且自动跟随 DSH 运行状态的角色浮层。

## 问题陈述

jiangxiao 皮肤的已落地实现与确认的 skin-preview 设计存在偏差：令牌表缺少 `tokens.css` 的代码语法 / 飘落装饰 / 诗句 / 动效时长 / 圆角阴影 / 布局令牌族；FX 特效的飘落数量与墨韵质感实现与设计不符（设计为 ≤8 片独立 SVG 飘落 + 静态 radial-gradient 墨晕，而非 12 片 + SVG turbulence）；角色浮层为纯透明无底，缺失设计要求的金色发光背光。用户期望皮肤视觉与 skin-preview demo 完全一致：深底亮字对比度天然达标、唐风炫技但可降级、角色有背光但仍自动跟随 DSH 状态。

## 解决方案

以 `.scratch/skin-preview/` 为唯一基准对已落地皮肤做对齐返工：

1. **令牌与 remap 对齐**：`--jx-*` 规范令牌按 `tokens.css` 暗浅双值表逐条补齐（surface / text / gold / seal / cinnabar / border-deco / ink-glow / scroll / 代码语法 kw·str·fn·cmt·num / petal / poem-color / font / motion / radius / shadow / layout）；`--dsw-static-*` / `--dsw-alias-*` / `--dsw-specific-*` remap 到唐风色板；暗/亮走官方信号 `body[data-ds-dark-theme]`。DSH 状态 remap 必需的辅助令牌（success/warn/error、selection、visited 链接）按唐风色板派生保留。
2. **FX 特效系统（保留开关，视觉对齐设计）**：五效 shimmer / fall / grain / breathe / micro 的「`html` 上 `fx-*` 类 + `localStorage('jx-fx')` + 设置卡开关 + 全关 = 与原版零差异 + `prefers-reduced-motion` 强制全关」机制不变；每效的视觉实现改为与 skin-preview 设计一致（fall ≤8 片独立 SVG、grain 静态墨晕、shimmer 鎏金顶栏 + 金箔文字、breathe 墨晕呼吸、micro 朱砂印章脉冲 / 三点脉冲 / 消息淡入）。
3. **角色浮层（恢复背光，保持自动跟随）**：右下角常驻浮层恢复金色发光背光（`drop-shadow` + `radial-gradient` 呼吸）；仍透明无容器底、`<img>` 播放 10 态 webp、状态自动跟随 DSH current 会话、过渡段播 TRANSITIONS、台词气泡淡入淡出。**不加手动状态切换按钮**（demo 的 10 按钮为预览便利，生产以自动跟随为准）。
4. **素材**：46 个 webp 已在仓库 `assets/character/`（仅开发源，ADR-0003），运行时经 dsh-pet 导入链服务，本轮不变。

## 用户故事

1. 作为皮肤用户，我想要启用 jiangxiao 后整个界面呈现墨金卷轴银杏深色主题，以便获得沉浸的唐风视觉体验。
2. 作为浅色偏好用户，我想要宣纸梅花浅色主题与深色同样完整，以便任一主题都不缺令牌值。
3. 作为用户，我想要顶栏鎏金流光、银杏（暗）/梅花（浅）≤8 片飘落、墨韵暗纹、墨晕呼吸、微交互（朱砂印章脉冲 / 三点脉冲 / 消息淡入）五类特效，以便界面酷炫生动且与 demo 一致。
4. 作为性能敏感用户，我想要每个特效独立开关，以便按需关闭耗性能的效果。
5. 作为性能敏感用户，我想要一键全关特效后与原版皮肤零差异，以便低端设备也能流畅使用。
6. 作为系统级动效敏感用户，我想要 `prefers-reduced-motion` 下所有动效自动关闭，以便符合可访问性预期。
7. 作为用户，我想要特效偏好被记住（localStorage），以便重启后保持我的设置。
8. 作为用户，我想要右下角常驻一个带金色发光背光、透明无容器底的角色，以便获得有氛围的桌宠式陪伴感。
9. 作为用户，我想要角色在 DSH 开始运行时进入 thinking 态，以便直观感知任务已启动。
10. 作为用户，我想要角色在流式输出时进入 replying 态、工具运行时进入 working 态，以便区分「在想」与「在干活」。
11. 作为用户，我想要出现错误时角色进入 error 态，以便第一时间察觉异常。
12. 作为用户，我想要有待审批/提问时角色进入 permission 态，以便及时响应交互请求。
13. 作为用户，我想要任务完成时角色短暂进入 done 态再回 idle，以便获得完成反馈。
14. 作为用户，我想要状态切换时播放过渡动画而非生硬跳变，以便视觉顺滑。
15. 作为用户，我想要缺失某个过渡段时自动降级为淡入淡出，以便素材不全时体验不崩。
16. 作为未导入素材的用户，我想要浮层自动隐藏且设置卡告诉我如何导入，以便不出现破图。
17. 作为用户，我想要启用皮肤且素材就绪时看到一次 welcome 动画，以便获得仪式感。
18. 作为用户，我想要浮层不拦截我的鼠标操作（仅必要控件可点），以便不影响正常工作。
19. 作为用户，我想要浮层只加载当前态素材、不一次性加载 232MB，以便内存与加载速度可控。
20. 作为用户，我想要台词气泡在状态变化时淡入淡出、随后自动隐去，以便有陪伴感但不遮挡内容。
21. 作为用户，我想要代码块有 kw/str/fn/cmt/num 五色语法高亮，以便阅读代码。
22. 作为维护者，我想要皮肤层只做 L2 remap、组件只消费语义别名，以便符合官方三层 token 架构、深浅双主题不漂移。
23. 作为维护者，我想要 preview 图、README 与测试随对齐返工同步更新，以便仓库门禁全绿。

## 实现决策

### 范围与基准（2026-08-19 设计基准切换）

- 全量对齐 `.scratch/skin-preview/`；`DESIGN.md` / `tokens.css` / `index.html` 三者一体，冲突时以 `tokens.css`（令牌）与 `index.html`（已确认 demo 的视觉/动效实现）为准。
- 皮肤语境下 L3 官方组件规则豁免（皮肤只做 L2 remap + 自有 DOM：设置卡/浮层）。
- 主战场：皮肤包 client 半区（样式模块、FX、浮层、设置卡）与包内文档/测试/预览图。
- demo 的三栏 Grid 布局（220px 1fr 220px）为整站预览参考，皮肤不重构 DSH 布局骨架，仅 remap 视觉层。

### 令牌与 remap（tokens.css 为准）

- `--jx-*` 规范令牌按 `tokens.css` 暗浅双值表逐条补齐，缺一即违规；不用纯 `#fff`/`#000`。
- `tokens.css` 未覆盖但 DSH remap 必需的辅助令牌按唐风色板派生保留：状态族 success/warn/error（石绿/藤黄/赭朱）供 `--dsw-alias-state-*`、selection 选中色、visited 链接色（取 seal/梅红族）。
- remap 原则：neutral/bluish → 墨阶 surface，blue/deepseek → 金族，green/red/amber → 石绿/赭朱/藤黄，alias/specific 全部指向 `--jx-*`。
- 暗/亮走官方信号 `body[data-ds-dark-theme]`；浅色 = `:not([data-ds-dark-theme])`。
- 侧边栏底色用 surface 色阶（深 `#121016`→`#0b090d` / 浅 `#f5eddf`→`#faf5ee`），金色退居 active accent / 边框 / 装饰点缀，对比度达标。

### FX 特效系统（保留开关机制，视觉对齐设计）

- 五效 shimmer / fall / grain / breathe / micro，由 `html` 上 `fx-*` 类控制，初始状态从 `localStorage('jx-fx')` 读取，默认全开；设置卡提供开关 UI。
- 无任何 `fx-*` 类时移除全部 animation/transition/装饰层，与原版皮肤无差异；`prefers-reduced-motion` 强制全关。
- 视觉对齐 skin-preview 设计：
  - **shimmer**：鎏金流光顶栏（`@property --gold-angle` + `conic-gradient` 旋转）+ 金箔文字流光（`background-clip: text` + `@property --shimmer-x`）。
  - **fall**：银杏（暗）/梅花（浅）飘落，**≤8 片独立 SVG**，各异轨迹/速度/延迟，`translate3d + rotate + opacity` GPU 合成，`will-change: transform, opacity`，父容器 `contain: strict`。
  - **grain**：墨韵暗纹，**静态多层 radial-gradient（`--jx-ink-glow`）零热循环**（设计无 SVG turbulence）。
  - **breathe**：墨晕呼吸（`@property --breathe` + 双层 radial-gradient opacity 呼吸）。
  - **micro**：朱砂印章脉冲（box-shadow 红晕呼吸）、忙碌三点脉冲（opacity 错开）、消息淡入（translateY + opacity）、hover/active 微交互。
- 零 backdrop-filter；装饰层一律 `pointer-events: none`。

### 角色浮层（恢复背光，保持自动跟随）

- 浮层 DOM 直挂 `document.body`，容器透明无底：`img { object-fit: contain }`，无 background。
- **恢复金色发光背光**：`drop-shadow`（金色光晕）+ `radial-gradient` 呼吸（`--breathe` 驱动），对齐 `index.html` 的 `.character-stage` 视觉；背光属装饰，受 `prefers-reduced-motion` 约束。
- **不加手动状态切换按钮**（demo 的 `.character-controls` 10 按钮为预览便利，生产不落地）。
- **事件源**：client 半区「快照 + subscribe」模型。apply 增加 `sessions` inject；`sessions.list.subscribe` 跟踪 current 会话，`binding(id).session.subscribe` 读 ConversationSnapshot（只用核心字段：`running` / `partial` / `runningCalls` / `pending` / `promptError` / `lastAgentError` / `openError`），不依赖投影 key。
- **状态映射**（current 会话，优先级从高到低）：error > permission > working > replying > thinking > done（边沿，驻留 3-5s）> reading（thinking 持续 ≥8s 无 chunk，本地 tick）> idle（兜底）。listening 弃用；welcome 在「皮肤启用 + 素材就绪」时本地触发一次，驻留 3s。
- **编排**：`reduceCharacter` 纯函数 + `TRANSITIONS` 枢纽表 + `getTransitionPath` 三件套；缺段 crossfade 兜底。

### 素材（不变）

- 46 个 webp 已在皮肤包 `assets/character/`（进 git，仅开发源：pack 工具输入 / demo / 预览，ADR-0003）。
- 运行时唯一来源：dsh-pet `GET /pet/jiangxiao/<file>`；npm `files` 不含 assets。
- 性能：img 按需加载——只加载当前态 webp，过渡段播完即释放；预取仅限 TRANSITIONS 表列出的下一段。
- 降级链：启动探测 `/pet/jiangxiao/idle.webp`，404 → 浮层不渲染 + 设置卡导入引导；运行中素材加载失败 → 回 idle 态。

### Seam（沿用既有，不新建）

- 皮肤 client `apply(ctx)`（skin-center 按需加载链）。
- dsh-pet 素材服务路由 `/pet/jiangxiao/<file>`。
- SkinSettingsCard（设置卡槽位）。
- `ctx.sessions` 快照订阅（dsh-task-board 先例）。

## 测试决策

- 好测试 = 只测外部行为：body 属性与 fx 类切换、localStorage 读写、浮层 DOM 存在性/透明无容器底契约 + 背光存在、素材缺失时浮层不渲染、快照 → 状态映射的优先级判定、TRANSITIONS 缺段兜底为 crossfade。不测 CSS 具体色值等实现细节。
- 被测模块：皮肤 client apply（含新增 inject）、浮层状态 reducer（纯函数）、TRANSITIONS 表与路径解析（纯函数）、设置卡导入引导。
- 先例：本包 `tests/`（vitest + jsdom）。
- 契约变更：浮层契约在「透明无容器底」基础上增加「带金色发光背光」断言；「injects no DOM chrome」断言维持「素材未导入时不注入浮层 DOM；导入后浮层带可识别标记」。

## 超出范围

- memorial 001 的增量项：素材 targetDir 用户自选、dsh-pet 路由扩展、打包工具 pack.mjs 本体。
- 后台会话活动聚合提醒（本次只跟随 current 会话）。
- listening 态、投影 key（todos/goal 等）增强展示。
- L3 官方组件改造（非皮肤职责）。
- skin-center 通用资产路由、皮肤包自建 host 半区（ADR-0003 已否决）。
- demo 的手动状态切换按钮、整站三栏布局重构（皮肤只 remap 视觉层）。

## 补充说明

- 设计基准全文在 `.scratch/skin-preview/DESIGN.md`；`--jx-*` 令牌暗浅双值表以 `.scratch/skin-preview/tokens.css` 为准，缺一即违规；已确认 demo 为 `.scratch/skin-preview/index.html`。
- 状态调查细节与代码位置证据见 `docs/memorial/002-jiangxiao-skin-revamp/sub-task/001-dsh-event-source.md`。
- 素材入仓决策见 `docs/adr/0003-jiangxiao-assets-in-repo-as-dev-source-only.md`。
- 遵守仓库全局约定：禁 emoji、禁改 DSH 源码、构建预设只用 shared/tsdown.client.ts；改动同步 README 中英三件套与 docs（`pnpm docs:check` 门禁）。
