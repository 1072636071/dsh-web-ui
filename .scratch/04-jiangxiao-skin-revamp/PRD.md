# PRD: jiangxiao 皮肤全面改造（对齐 dsh-web-ui-jx DESIGN.md）

Status: ready-for-agent

来源：docs/memorial/002-jiangxiao-skin-revamp（已完成 grill，8 项决策 + ADR-0003 + 事件源调查闭环）。设计唯一基准：`E:\work\sp\dsh-web-ui-jx\DESIGN.md`（官方三层 token 架构 + `--jx-*` 令牌暗浅双值表 + FX 特效系统 + 角色浮层专规）。

## 问题陈述

jiangxiao 皮肤当前是早期实现：令牌表/remap 与 dsh-web-ui-jx 项目固化的 DESIGN.md 基准存在偏差，CSS 炫技无独立开关（性能敏感用户无法降级），角色浮层不存在（旧 demo 的金色背光、手动切换已被新浮层专规否决）。用户期望皮肤视觉与 jx 项目完全一致：墨金卷轴（深）/ 宣纸梅花（浅）双主题、可关的特效系统、以及一个能自动跟随 DSH 运行状态的透明角色浮层。

## 解决方案

以 jx 的 DESIGN.md 为唯一基准全面重写 jiangxiao 皮肤：

1. **令牌与 remap 重写**：`--jx-*` 规范令牌按 DESIGN.md 暗浅双值表逐条补齐；`--dsw-static-*` / `--dsw-alias-*` / `--dsw-specific-*` remap 到唐风色板；暗/亮走官方信号 `body[data-ds-dark-theme]`。
2. **FX 特效系统**：shimmer / fall / grain / breathe / micro 五效，默认开、可独立关（`html` 上 `fx-*` 类 + `localStorage('jx-fx')`），全关 = 与原版皮肤零差异；`prefers-reduced-motion` 强制全关。
3. **角色浮层**：右下角常驻透明浮层（无背景/无光晕/无背光），`<img>` 播放 10 态 webp，状态自动跟随 DSH current 会话；状态切换播 TRANSITIONS 过渡段，缺段 crossfade 兜底；台词气泡淡入淡出。
4. **素材**：46 个 webp 复制进仓库（仅开发源），运行时经 dsh-pet 导入链服务；未导入时浮层不渲染，设置卡引导导入。

## 用户故事

1. 作为皮肤用户，我想要启用 jiangxiao 后整个界面呈现墨金卷轴深色主题，以便获得沉浸的唐风视觉体验。
2. 作为浅色偏好用户，我想要宣纸梅花浅色主题与深色同样完整，以便任一主题都不缺令牌值。
3. 作为用户，我想要顶栏鎏金流光、银杏（暗）/梅花（浅）飘落、墨韵暗纹、墨光呼吸、微交互五类特效，以便界面酷炫生动。
4. 作为性能敏感用户，我想要每个特效独立开关，以便按需关闭耗性能的效果。
5. 作为性能敏感用户，我想要一键全关特效后与原版皮肤零差异，以便低端设备也能流畅使用。
6. 作为系统级动效敏感用户，我想要 `prefers-reduced-motion` 下所有动效自动关闭，以便符合可访问性预期。
7. 作为用户，我想要特效偏好被记住（localStorage），以便重启后保持我的设置。
8. 作为用户，我想要右下角常驻一个透明无底的角色，以便获得桌宠式陪伴感。
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
19. 作为开发者，我想要仓库内置全套素材作为开发源，以便克隆即可跑 demo 和打包工具。
20. 作为 npm 用户，我想要通过设置卡引导经 dsh-pet 导入素材，以便不必下载 232MB 的 npm 包。
21. 作为用户，我想要浮层只加载当前态素材、不一次性加载 232MB，以便内存与加载速度可控。
22. 作为用户，我想要台词气泡在状态变化时淡入淡出、随后自动隐去，以便有陪伴感但不遮挡内容。
23. 作为维护者，我想要皮肤层只做 L2 remap、组件只消费语义别名，以便符合官方三层 token 架构、深浅双主题不漂移。
24. 作为维护者，我想要 preview 图、README 与测试随改造同步更新，以便仓库门禁全绿。

## 实现决策

### 范围与基准（memorial 002 Q1）

- 全量对齐 jx DESIGN.md；皮肤语境下 L3 官方组件规则豁免（皮肤只做 L2 remap + 自有 DOM：设置卡/浮层）。
- 主战场：皮肤包 client 半区（样式模块、apply 入口、设置卡、新增浮层模块）与包内文档/测试。

### FX 特效系统（DESIGN.md §5）

- 五效 shimmer / fall / grain / breathe / micro，由 `html` 上 `fx-*` 类控制，初始状态从 `localStorage('jx-fx')` 读取，默认全开。
- 无任何 `fx-*` 类时移除全部 animation/transition/装饰层，与原版皮肤无差异。
- fall（银杏/梅花飘落）用 Web Animations API、GPU transform、12 片；grain 用静态 SVG turbulence（零热循环）；breathe 为 body::after opacity 呼吸。
- 特效开关 UI 放在皮肤设置卡。

### 角色浮层（Q2/Q3/Q5/Q6/Q9 + sub-task/001 调查结论）

- 浮层 DOM 直挂 `document.body`（dsh-pet 先例），透明无底：`img { object-fit: contain }`，容器无 background/box-shadow/背光；`pointer-events: none`（仅状态相关控件可点）。
- **事件源**：client 半区「快照 + subscribe」模型。apply 增加 `sessions` inject；`sessions.list.subscribe` 跟踪 current 会话，`binding(id).session.subscribe` 读 ConversationSnapshot（只用核心字段：`running` / `partial` / `runningCalls` / `pending` / `promptError` / `lastAgentError` / `openError`），不依赖投影 key（规避宿主版本漂移）。
- **状态映射**（current 会话，优先级从高到低）：error（`promptError/lastAgentError/openError` 非空）> permission（`pending` 含 approval/question）> working（`runningCalls.length > 0`）> replying（`partial` 含可见 chunk）> thinking（`running && !partial`）> done（`running` true→false 边沿，无 error/pending，驻留 3-5s）> reading（thinking 持续 ≥8s 无 chunk，本地 tick 推导）> idle（兜底）。
- listening 弃用（无 DSH 信号）；welcome 在「皮肤启用 + 素材就绪」时本地触发一次，驻留 3s。
- **编排**：移植 openCodeMM 的 `reduceCharacter` 纯函数（13 种归一化事件 + 优先级表 + `preWorking/prePermission` 回退 + 时序常量）与 `TRANSITIONS` 枢纽表 + `getTransitionPath(from, to)` 三件套；调用层负责「ConversationSnapshot 差分 → 归一化事件」。TRANSITIONS 按 jiangxiao 实有 36 段过渡 webp 填表（`durationMs = 帧数/15fps`）；`from===to` 空序列、无素材段落返回空、播放层 crossfade 兜底。

### 素材（Q4 + ADR-0003）

- 46 个 webp 从 openCodeMM `public/character/` 复制到皮肤包 `assets/character/`（进 git，+232MB，仅开发源：pack 工具输入 / demo / 预览）。
- 运行时唯一来源：dsh-pet `GET /pet/jiangxiao/<file>`；npm `files` 不含 assets。
- 性能：img 按需加载——只加载当前态 webp，过渡段播完即释放；预取仅限 TRANSITIONS 表列出的下一段。不预载全部 46 个。
- 降级链：浮层启动时探测 `/pet/jiangxiao/idle.webp`，404 → 浮层不渲染 + 设置卡显示导入引导；运行中素材加载失败 → 回 idle 态。

### Seam（沿用既有，不新建）

- 皮肤 client `apply(ctx)`（skin-center 按需加载链）。
- dsh-pet 素材服务路由 `/pet/jiangxiao/<file>`。
- SkinSettingsCard（设置卡槽位）。
- `ctx.sessions` 快照订阅（dsh-task-board 先例）。

## 测试决策

- 好测试 = 只测外部行为：body 属性与 fx 类切换、localStorage 读写、浮层 DOM 存在性/透明无底契约、素材缺失时浮层不渲染、快照 → 状态映射的优先级判定、TRANSITIONS 缺段兜底为 crossfade。不测 CSS 具体色值等实现细节。
- 被测模块：皮肤 client apply（含新增 inject）、浮层状态 reducer（纯函数，可脱离 DOM 单测）、TRANSITIONS 表与路径解析（纯函数）、设置卡导入引导。
- 先例：本包 `tests/`（vitest + jsdom，现有 apply.spec.ts）；reducer/TRANSITIONS 参照 openCodeMM 纯函数形态做表驱动单测。
- 契约变更：现有「injects no DOM chrome」断言需改为「素材未导入时不注入浮层 DOM；导入后浮层带可识别标记」。

## 超出范围

- memorial 001 的增量项：素材 targetDir 用户自选、dsh-pet 路由扩展、打包工具 pack.mjs 本体（001 未闭环部分）。
- 后台会话活动聚合提醒（本次只跟随 current 会话）。
- listening 态、投影 key（todos/goal 等）增强展示。
- L3 官方组件改造（非皮肤职责）。
- skin-center 通用资产路由、皮肤包自建 host 半区（ADR-0003 已否决）。

## 补充说明

- 设计基准全文在 `E:\work\sp\dsh-web-ui-jx\DESIGN.md`；`--jx-*` 令牌暗浅双值表以该文件 §2 为准，缺一即违规。
- 状态调查细节与代码位置证据见 `docs/memorial/002-jiangxiao-skin-revamp/sub-task/001-dsh-event-source.md`。
- 素材入仓决策见 `docs/adr/0003-jiangxiao-assets-in-repo-as-dev-source-only.md`。
- 遵守仓库全局约定：禁 emoji、禁改 DSH 源码、构建预设只用 shared/tsdown.client.ts；改动同步 README 中英三件套与 docs（`pnpm docs:check` 门禁）。
