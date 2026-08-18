# Memorial 002 — jiangxiao-skin-revamp

**状态**: 已完成

## 诉求

用户原话：

> 使用这个项目的需求，全面改造 jiangxiao皮肤：E:\work\sp\dsh-web-ui-jx\docs

核心意图：以 `dsh-web-ui-jx` 项目（独立 DSH Bundle 插件）已固化的需求/设计基准为输入，对本仓库 `packages/skins/jiangxiao/` 皮肤做全面改造。

**参考材料（dsh-web-ui-jx/docs，已读取）**：

- `docs/adr/0001-dsh-bundle-plugin-not-skin.md` — jx 项目定位为独立插件而非皮肤（架构不直接适用于本仓库皮肤形态，仅作背景）。
- `docs/adr/0002-official-three-layer-token-baseline.md` — **官方三层 token 架构为唯一设计基准**：L1 base（`--dsw-font-family` 等）→ L2 skin remap（`body[data-dsh-jiangxiao]` 下 `--jx-*` 令牌 + `--dsw-static/alias/specific` remap 到唐风色板，浅色 = `:not([data-ds-dark-theme])`）→ L3 组件只消费 `--dsw-alias-*` / `--dsw-specific-*`，禁止颜色字面量与主题选择器。
- `DESIGN.md`（项目根）— 唯一设计基准：设计哲学（墨金卷轴/宣纸梅花、深底浅字、装饰克制、特效可关）、`--jx-*` 令牌暗浅双值表、remap 原则、L3 组件结构、角色浮层专规（透明无底、10 态 webp、`<img>` 播放）、FX 特效系统（shimmer/fall/grain/breathe/micro，`fx-*` 类 + `localStorage('jx-fx')` 控制，全关 = 与原版无差）、动效与可访问性、禁用项。
- `docs/memorial/001-dsh-plugin-ui/context.md` — jx 项目全部 grill 决策：素材已复制进 jx 仓库 `assets/`（46 webp 232MB + 2 woff2 + 2 png），demo 原型 `.temp/preview/jiangxiao-demo.html` 按三层架构重写，官方小鲸鱼 logo（FishLogo 精确 path）保留。

**本仓库现状（packages/skins/jiangxiao）**：

- 皮肤形态：挂 skin-center，运行时资产 base64 内联于 `art.ts`，无外部资产服务机制。
- 已有：`jiangxiao.module.css`（`--jx-*` 令牌 + 三层 remap + CSS 炫技）、`art.ts`（2 woff2 内联 4.03MB）、`SkinSettingsCard.tsx`（检测 `/api/pet/pets` 引导导入）、preview dark/light.png。
- 已有 memorial 001（jiangxiao-asset-pack，进行中）：打包工具 + 复用 dsh-pet 导入链，P1-P6 多项待澄清未闭环。

**关键张力（待 grill）**：jx 的 DESIGN.md 是在「独立插件」语境下写的（组件层 L3 规则约束的是插件自己的组件）；而本仓库 jiangxiao 是「皮肤」，L3 是 DSH 官方组件，皮肤只能做 L2 remap。「全面改造」的确切范围需澄清。

## 追问记录

### 2026-08-18 — Q1 改造范围锚点

**追问**：jx 的 DESIGN.md 是「独立插件」语境（L3 约束插件自有组件），本仓库 jiangxiao 是「皮肤」（L3 为 DSH 官方组件，皮肤只能做 L2 remap + 自有 DOM）。呈现 3 方案：全量对齐 DESIGN.md / 只移植 token 与 remap / 反向以皮肤为准。

**用户决策**：方案 1「全量对齐 DESIGN.md」，并明确设计令牌以 `E:\work\sp\dsh-web-ui-jx\DESIGN.md` 为准。

**含义**：
- 以 jx 的 DESIGN.md 为唯一基准重写 `jiangxiao.module.css` 令牌表/remap/FX 系统（含 `fx-*` 类 + `localStorage('jx-fx')` 可关机制，全关 = 与原版皮肤无差）。
- 角色浮层按「浮层专规」重做：透明无底、去金色背光（与 memorial 001 旧 demo 的 drop-shadow 背光冲突，新规为准）、`<img>` 播放 10 态 webp。
- `--jx-*` 令牌暗浅双值表逐条核对补齐，缺一即违规。
- 皮肤语境豁免：L3 官方组件规则不适用（组件不归皮肤写）。
- 牵连面：preview 图、测试契约（apply.spec.ts）、README 三件套、`docs/` 相关描述。

### 2026-08-18 — Q2 角色浮层与素材链依赖

**追问**：浮层专规要求 46 webp（232MB），皮肤包无法内联，只能走 dsh-pet 导入链；memorial 001（打包/导入）仍「进行中」、P1-P6 未闭环。呈现 3 方案：浮层纳入本次+复用 dsh-pet 现状 / 只做视觉待 001 闭环 / 顺带 grill 掉 001 的 targetDir 自选。

**用户决策**：方案 1「浮层纳入本次，素材链复用 dsh-pet 现状」，并明确**先简单处理，后续再继续强化**。

**含义**：
- 本次浮层只做最小闭环：透明无底 `<img>` 播放、10 态切换、素材缺失降级（未导入则浮层不显示/占位）；状态切换先用简化方案（不强求完整 DSH 事件自动映射 + 36 过渡态编排）。
- 素材服务复用 dsh-pet 现状路由 `GET /pet/jiangxiao/<file>`；导入入口沿用设置卡（不内嵌新导入流程）。
- memorial 001 的 targetDir 自选、dsh-pet 路由扩展等增量项不在本次范围，留待后续强化。
- 001 保持「进行中」，与本 memorial 并存。

### 2026-08-18 — Q3 状态切换简化粒度

**追问**：手动 10 态直切 / 手动 + 过渡态 / 自动跟随 DSH 状态最小映射，三档。

**用户决策**：方案 3「自动跟随 DSH 状态」，和当前插件（DSH 宿主/会话事件）对接做状态映射；并指示「各种素材直接放代码仓库」。

**含义**：
- 浮层状态自动跟随 DSH 运行状态（需调查 client 半区可用事件源， memorial 001 P3.2 未闭环项，本次闭环）。
- 「素材直接放代码仓库」存在硬约束，需 Q4 澄清落地方式（见下）。

### 2026-08-18 — Q4 素材入仓的落地方式（事实核查后追问）

**事实核查（皮肤包架构约束，结论仍成立）**：
- skin-center `routes.ts` 的 bundle 路由只服务 `packages/skins/<id>/lib/client.js`（已读源码确认），无通用资产路由。
- 232MB webp base64 内联不可行（memorial 001 已证）。
- 皮肤包 `files` 字段发 npm；232MB 进 npm 包不现实。
- jx 项目做法（素材进 git 进 `assets/`）成立的前提是它是独立插件、自建 host 路由；本仓库皮肤包无此机制。

**追问**：素材入仓后如何服务，4 方案（见对话）。

**用户决策**：方案 3「素材入仓仅作开发源，运行时仍走 dsh-pet 导入」。并授权：「可以推翻之前的 adr；其他决策你自己来决策，目的 = 尽可能酷炫 + 考虑性能」。

**含义**：
- 素材复制进 `packages/skins/jiangxiao/assets/character/`（进 git，+232MB），用途 = pack.mjs 输入源 + demo 自洽 + 开发预览；**运行时不从仓库服务**。
- 浮层运行时素材唯一来源 = dsh-pet 导入链 `/pet/jiangxiao/<file>`（memorial 001 决策 5 维持，未推翻）。memorial 001 的 P2.2（打包输入源）随之闭环：仓内 `assets/`。
- npm 发布 `files` 不含 assets；npm 用户走导入流程。
- 用户授权自主决策剩余问题（Q5-Q9），目标函数：酷炫优先 + 性能可控。

### 2026-08-18 — 调查闭环 + 自主决策（Q5-Q9）

**调查**：sub-task/001（DSH client 事件源）已闭环。结论：client 半区走「快照 + subscribe」模型（`ctx.sessions.list` + `binding(id).session` 的 `ConversationSnapshot`）；7 态有直接信号，reading 本地 tick 推导，listening/welcome 无信号；openCodeMM `reduceCharacter` + `TRANSITIONS` 三件套纯函数可直接移植。

**自主决策（用户授权，目标 = 酷炫 + 性能）**：

- **Q5 过渡态**：纳入。移植 `TRANSITIONS` 枢纽表 + `getTransitionPath` 纯函数，按 jiangxiao 实有 36 段过渡 webp 填表；缺段自动 crossfade 兜底。酷炫收益最大、实现为纯函数，值得本次做。
- **Q6 状态映射与跟随范围（U3）**：跟随 current 会话（宿主全局浮层，dsh-pet 先例），优先级 error > permission > working > replying > thinking > done(边沿) > reading(tick 8s) > idle。client 直订快照（dsh-task-board 路线），apply 增加 `sessions` inject。listening 弃用（无信号）；welcome 在「皮肤启用 + 素材已就绪」时本地触发一次，驻留 3s。
- **Q7 性能策略**：img 懒加载——只加载当前态 webp，过渡段播完即释放（src 置空）；预取仅限 TRANSITIONS 表列出的下一段（浏览器预连接 + 低优先级 fetch）。不预载全部 46 个（232MB）。FX 遵循 DESIGN.md 默认开、可独立关、全关 = 原版零开销；`prefers-reduced-motion` 强制全关。
- **Q8 宿主版本漂移（U1）**：以本仓库 pnpm 钉版的 `@deepseek-ai/*` 类型为准；浮层只用 ConversationSnapshot 核心字段（running/partial/runningCalls/pending/promptError/lastAgentError），不依赖投影 key，规避漂移。
- **Q9 降级链**：浮层启动时 HEAD `/pet/jiangxiao/idle.webp`；404 → 浮层不渲染 + 设置卡显示导入引导（现状沿用）；部分缺段 → TRANSITIONS 缺段 crossfade 兜底；素材加载失败 → 回 idle 态。

**ADR 评估**：Q4（素材入仓仅作开发源）满足 ADR 三条件（难逆转：+232MB 进 git；未来读者会惊讶：素材在仓却不从仓服务；否决了 skin-center 路由方案）→ 创建 ADR-0001。三层 token 对齐 DESIGN.md 属执行既定基准，不另立 ADR。

## 决策汇总

1. **改造范围（Q1）**: 全量对齐 `E:\work\sp\dsh-web-ui-jx\DESIGN.md`（唯一设计基准）。重写令牌表/remap/FX 可关系统；角色浮层按浮层专规重做（透明无底、无背光、img 播放 webp）；L3 官方组件规则皮肤语境豁免；preview/测试/README 同步更新。
2. **浮层与素材链（Q2）**: 浮层纳入本次。**先简单处理，后续强化**：最小闭环先行，增量项留待后续。（注：Q3 用户改选自动状态映射后，素材链部分被 Q4 重新打开。）
3. **状态切换（Q3+Q6）**: 浮层状态**自动跟随 DSH current 会话**（宿主全局浮层，client 直订 ConversationSnapshot 快照）。映射优先级 error > permission > working > replying > thinking > done(边沿) > reading(tick 8s) > idle；listening 弃用；welcome 皮肤启用+素材就绪时本地触发一次。
4. **素材落地（Q4）**: 素材入仓 `packages/skins/jiangxiao/assets/character/`（进 git，仅开发源/pack.mjs 输入/demo 自洽）；运行时唯一来源 = dsh-pet `/pet/jiangxiao/<file>`；npm `files` 不含 assets。（ADR-0001）
5. **过渡态（Q5）**: 移植 openCodeMM `TRANSITIONS` 枢纽表 + `getTransitionPath` + `reduceCharacter` 纯函数三件套，按 36 段实有素材填表，缺段 crossfade 兜底。
6. **性能（Q7）**: webp 按需加载（当前态 + 预取下一段），不预载全部；FX 默认开可独立关、全关=原版零开销；`prefers-reduced-motion` 强制全关。
7. **版本纪律（Q8）**: 类型以 pnpm 钉版 `@deepseek-ai/*` 为准；浮层只用 ConversationSnapshot 核心字段，不依赖投影 key。
8. **降级链（Q9）**: 未导入 → 浮层不渲染 + 设置卡引导；缺过渡段 → crossfade；加载失败 → 回 idle。

## 待澄清

（空。U1-U3 由 Q6/Q8 闭环。）

## 收尾回写记录（2026-08-18）

- **checklist 全绿**：C1 诉求回应 ✅、C2 决策完备 ✅、C3 待澄清清零 ✅、C4 调查闭环 ✅（sub-task/001 已调查）、C5 ADR 齐全 ✅。
- **ADR 同步**：memorial ADR-0001 已回写为全局 `docs/adr/0003-jiangxiao-assets-in-repo-as-dev-source-only.md`。
- **CONTEXT.md**：用户确认不增补术语（沿用 jx DESIGN.md 与现有文档）。
- 本 memorial 不再追加，建议归档。
