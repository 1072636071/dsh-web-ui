# Sub-task 001 — DSH client 半区事件源调查

**状态**: 已调查（结论见「调查结果」，待 grill 确认映射表取舍）

## 任务

目标：为 jiangxiao 皮肤角色浮层的「状态自动跟随」找到可用的事件源与状态映射依据。

背景：浮层要按 DESIGN.md 播放 10 态 webp（idle/thinking/reading/replying/working/error/welcome/done/permission/listening）。需要弄清 DSH web GUI 的 client 半区（浏览器侧）有哪些可订阅的运行状态信号。

## 调查问题

1. **client 半区可用事件源**：皮肤包 client `apply(ctx)` 里能拿到什么？cordis ctx 上有哪些事件/服务可订阅（sessions、workspaces、任务/运行时状态）？deepseek-harness 宿主（`E:\work\sp\deepseek-harness`，本地只读参考）的 client 包暴露了哪些事件 API？本仓库其他插件（dsh-pet / dsh-live-stats / dsh-task-board 等）是否已有「监听 DSH 运行状态」的先例？列出具体代码位置。
2. **状态映射建议**：基于可用事件，给出 DSH 状态 → 10 态的最小可行映射表（哪些态有事件支撑、哪些态本次只能不用）。
3. **过渡态编排参考**：openCodeMM（`E:\work\sp\openCodeMM`）的 character-state.ts / character-transition.ts 的 reducer 与 TRANSITIONS 表结构，给出可移植的最小结构。

## 输出

结论写回本工单（追加「调查结果」段），含代码位置证据（文件:行）。只读调查，不改代码。

## 调查结果

调查时间 2026-08-18；范围：本仓库 client 插件先例 + `E:\work\sp\deepseek-harness`（宿主，只读）+ `E:\work\sp\openCodeMM`（素材/编排参考，只读）。未改任何代码。

### Q1：client 半区可用事件源

**结论：皮肤包 `apply(ctx)` 拿到的是 cordis `ClientContext`；运行时状态的全部入口是「快照 + subscribe」模型，而非逐事件回调。主要可用源四类：**

F1. `ctx.sessions: ISessions` —— 根级会话服务。
- `sessions.list: ObservableSnapshot<SessionListState>`（`getSnapshot()/subscribe(fn)`，见 `deepseek-harness/packages/client/runtime/src/client/contract/store.ts:27`）。`SessionListState` 含 `ids/byId/current/phase/jobsBySession`（`.../sessions/service.ts:80-98`）；`SessionSummary` 每行直接带运行状态位：`running`（`service.ts:58`）、`pendingInteraction: 'approval'|'plan-review'|'question'`（`service.ts:60` + `sessions/pending.ts:19`）、`completed`（未选中时完成的绿色提醒位，`service.ts:62`）、`blank`（`service.ts:69`）。
- `sessions.binding(id).session: SessionFace = ISession & ObservableSnapshot<ConversationSnapshot>`（`contract/session.ts:89`），即对单会话可 `getSnapshot()/subscribe`。
- ISessions 完整面（list/currentProvideInfo/binding/scope/sessionOf/open/fork…）见 `contract/sessions.ts:26-130`。

F2. `ConversationSnapshot`（细粒度运行状态的最主要来源）—— `sessions/conversation.ts:433-477`，关键字段：
- `running: boolean`（450）、`partial: PartialAssistant | null`（445，流式 chunk 累积，`partial.ts:14-20` 判定可见 chunk 为 block-start/text-delta/reasoning-delta/tool-call-delta/block-end）、`runningCalls: RunningToolCall[]`（446，工具运行中）、`pending: PendingInteraction[]`（447，approval/question 等待）、`promptError`（464）、`lastAgentError`（476）、`openError`（461）、`composerPhase: 'blank'|'engaging'|'active'`（457 + 355）、`removed`（459）。

F3. `session.projections: ProjectionsFace` —— host 端算好按 key 下发的投影（`contract/session.ts:19-27, 33-34`；client store `sessions/projection-store.ts:33-40` 的 `UseProjection` 类型）。已注册的 key（declare-merge 进 `SessionProjectionMap`）：`tokenUsage/contextPressure/contextBreakdown`（`llm/token-meter/src/projection.ts:68-77`）、`todos`（`todo/tool-todo/src/types.ts:15-24`）、`permissions`（`interaction/permission-presets/src/types.ts:34-44`）、`goal`、`plan`、`title`、`sessionStats`、`subagent/subagentTiming` 等。React 侧经 session 标准 kit 的 `useProjection` 钩子消费（本仓库先例 `packages/dsh-live-stats/src/client/TpsLine.tsx:42` 读 `liveTokenUsage`）。
- ⚠️ 版本漂移备注：`liveTokenUsage` 在本地 `E:\work\sp\deepseek-harness` 检出中未找到声明；本仓库 `packages/dsh-live-stats/src/projection.ts:3-4` 注释指其 augmentation 在 `@deepseek-ai/dsh-token-meter/projection`（npm 钉版）。宿主本地参考与线上钉版存在差异，引用投影 key 时以钉版为准。

F4. cordis ctx 事件与 Remote 转发：
- 客户端 Events 表只声明两个 emit 事件：`'slots/changed'` 与 `'connection/reset'`（连接代际（重）建立时触发，`runtime/src/client/index.ts:153-168, 221`）。连接状态另有 `ConnectionState = 'connected'|'reconnecting'`（`client/connection/src/client/connection.ts:40`），经 connection sinks 内部消费，未作为 ctx 事件外发。
- `ctx.remote.$on(event, listener)` 订阅 host 单向转发事件（`typert/protocol/src/types.ts:237`；host 帧桥接在 `runtime/src/client/index.ts:216`）。已见转发事件名：`settings/document-updated`、`credentials/updated`、`agent-preset/selected`、`llm/adapters-updated`、`commands/change`（各 ui-* 包测试与源码），**不含会话运行状态类事件**——运行状态不走 remote 转发，走 F1/F2 快照。
- `ctx.workspaces: IWorkspaces`（`contract/workspaces.ts`，Context merge 见 `runtime/src/client/index.ts:178`）提供 workspace 列表快照，与运行状态无关，仅上下文元数据。

**本仓库「监听 DSH 运行状态」先例（三条路线都已存在）：**
- P1. **host 半区订阅会话事件 → client 轮询 JSON**（dsh-pet）：host `ctx.on('session/event', (session, event) => …)`（`packages/dsh-pet/src/service.ts:297`）喂 `projectOfficialEvent`（`packages/dsh-pet/src/event-projection.ts:52-130`）：`turn/start`、`step/start`→waiting；`assistant/chunk` reasoning-delta→thinking、text-delta→review；`tool/call`→tool、`tool/result` 按失败与否→failed/thinking；`turn/end` reason completed→done / error,max-tokens,interrupted→failed / blocked→waiting / aborted→idle。client 半区不订阅事件，每 2s 轮询 `/api/pet/state`（`packages/dsh-pet/src/client/index.ts:70, 155-169`），浮层直挂 `document.body`（同文件 284-288）。
- P2. **client 半区直接订快照**（dsh-task-board）：`inject` 声明 `sessions/workspaces/connection`（`packages/dsh-task-board/src/client/index.ts:71`），`sessions.binding(id).session.getSnapshot()/subscribe`（同文件 138-139）、`workspaces.list.subscribe`（219）、`ctx.on('connection/reset', …)`（240）。
- P3. **session-scoped slot + useProjection**（dsh-live-stats）：注册进 `conversation.composer.dock` 槽位拿 session 标准 kit 的 `useProjection`（`packages/dsh-live-stats/src/client/index.ts:100-105` + `TpsLine.tsx:42, 55-57`）。
- 注：jiangxiao 皮肤现状只挂 skin-center + `settings.section`，inject 仅 `['slots','locale']`（`packages/skins/jiangxiao/src/client/index.ts:34, 56-95`），尚无运行状态订阅；要跟随状态需为 client apply 增加 `sessions` 依赖（P2 路线，宿主全局浮层）或改挂 session 槽位（P3 路线，session 作用域）。

### Q2：DSH 状态 → 10 态最小可行映射建议

**结论：10 态中 7 态有直接快照信号支撑；reading 由本地 tick 推导（openCodeMM 同款做法）；listening、welcome 无 DSH 运行态事件支撑，本次建议降级/本地触发。**

| 10 态 | client 信号（建议判定式，current 会话） | 证据 |
| --- | --- | --- |
| idle | 兜底：`!running && pending 空 && !completed`（或无 current 会话） | `service.ts:58-62`、`conversation.ts:450` |
| thinking | `running === true && partial === null`（轮次已起、尚无可见 chunk） | `conversation.ts:445,450`；host 先例 `step/start`→waiting（`event-projection.ts:61-64`） |
| replying | `partial !== null && partial.blocks` 含 text/reasoning chunk（或纯 reasoning 可再细分回 thinking） | `partial.ts:14-20`；host 先例 `assistant/chunk` text-delta→review（`event-projection.ts:65-74`） |
| working | `runningCalls.length > 0` | `conversation.ts:446`；host 先例 `tool/call`→tool（`event-projection.ts:77-84`） |
| error | `promptError !== null \|\| lastAgentError !== null \|\| openError !== null` | `conversation.ts:461,464,476`；host 先例 `turn/end` error/max-tokens/interrupted→failed（`event-projection.ts:109-114`） |
| permission | `pending.some(kind==='approval')`（session 快照）或 `summary.pendingInteraction === 'approval'`（列表行，无需 binding）；`question/plan-review` 同字段 | `conversation.ts:447`、`pending.ts:19`、`service.ts:60` |
| done | 边沿推导：`running` true→false 且无 error/pending；或 `summary.completed === true`（未选中会话完成位） | `conversation.ts:450`、`service.ts:62`；host 先例 `turn/end` completed→done（`event-projection.ts:101-108`） |
| reading | **无直接事件**：openCodeMM 用本地 tick 推导（thinking 持续 ≥8s 无 chunk 切 reading）——可在 client 侧复刻，非 DSH 信号 | `openCodeMM/.../character-state.ts:88, 126-128` |
| listening | **无直接信号**：openCodeMM 用「流式结束」事件切入（`text_ended`→listening）；DSH 快照无此边沿，只能靠 `partial` 非空→空且 `running` 仍 true 的差分近似，本次建议并入 idle/thinking | `character-state.ts:43, 165` |
| welcome | **无运行态事件**：openCodeMM 用 `server_connected`；DSH 对应物仅 `connection/reset`（每次重连都触发，非首次专属），语义不等价。建议本次由「素材导入完成/皮肤启用」本地触发，或不用 | `character-state.ts:51, 167`；`runtime/src/client/index.ts:221` |

**最小可行落地形态（推断，供 grill 取舍）**：跟随 current 会话 —— `sessions.list.subscribe` 跟踪 `current` 变化，对 current 会话 `binding(id).session.subscribe` 读 ConversationSnapshot，按上表优先级（error > permission > working > replying > thinking > done(边沿) > idle）求值；done/welcome/reading 的驻留与超时由本地 tick 驱动。优先级语义与 openCodeMM PRIORITY 表一致（见 Q3）。

### Q3：openCodeMM 过渡态编排参考（可移植最小结构）

**结论：两个纯函数模块，无 DOM/无定时器，seam 清晰，可直接移植为 TS 模块（改动仅在事件归一化层与素材路径）。**

F5. `reduceCharacter(currentStatus, event, now) → nextStatus`（`openCodeMM/opencode/packages/app/src/components/character-state.ts:117-120`）：
- 状态联合 = 目标 10 态逐字一致（`character-state.ts:19-29`）。
- `CharacterEvent` 归一化事件 13 种（`character-state.ts:35-64`）：session_idle / prompt_admitted / text_delta / text_ended / tool_called / tool_finished / session_error / server_connected / execution_finished(pendingTools) / permission_asked / permission_replied / tick / force / auto。调用方负责把宿主原始事件映射进此联合——移植到 DSH 时这层改为「ConversationSnapshot 差分 → CharacterEvent」。
- `CharacterStatus` 携带时序与回退元数据（`character-state.ts:67-85`）：`thinkingSince/doneSince/welcomeSince`（tick 驱动超时）、`preWorking/prePermission`（退出 working/permission 回退先前态）、`override/preOverride`（演示强制态，可选不移植）。
- 优先级表（`character-state.ts:95-106`）：error 5 > working 4 > permission 3 > thinking/replying/done/reading 2 > listening/welcome/idle 1；高优先级不被低优先级事件打断（`preempt` 函数 208-212）。
- 时序常量（`character-state.ts:88-91`）：reading 阈值 8000ms、done 驻留 3000~5000ms、welcome 驻留 3000ms。
- 关键流转规则：reading 下来任何业务事件先切回 thinking（147）；`execution_finished` 且 `pendingTools=false` 才进 done，且 idle/welcome/listening 下不播 done（250-259）。

F6. `TRANSITIONS` 表 + `getTransitionPath(from, to) → TransitionSegment[]`（`character-transition.ts:87-95`）—— 枢纽制过渡段解析：
- 表结构：key `"<from>→<to>"` → `{ webp, durationMs, key }`（62-73）；`durationMs = 帧数 / 15fps`（24-31）。
- 段定义即三元组数组 `SEGMENTS: [from, to, 帧数][]`（36-56）：idle 枢纽正放 9 段 + 倒放 9 段 + thinking↔replying 直达 2 段（另有 B 级扩展态段，本次不用）。
- 解析规则：`from===to`→空；有直达段→1 段；否则经 idle 枢纽 2 段（两段都需在表）；无素材→空序列，由播放层 crossfade 兜底（87-95）。
- **移植最小结构**：`type TransitionSegment { webp; durationMs; key }` + `TRANSITIONS: Record<"from→to", TransitionSegment>` + `getTransitionPath(from, to)` 三件套；素材表按 jiangxiao 实有过渡 webp 重新填，缺段自动落 crossfade，与 memorial 002 Q2「先简单处理」兼容（甚至可以先空表全 crossfade，后续补段只加表项）。

### 待澄清 / 不确定

- U1. **宿主参考版本漂移**：本地 `deepseek-harness` 检出未见 `liveTokenUsage` 声明（见 F3 备注）；若浮层想用投影 key（如 todos/goal 增强 working 展示），需以本仓库 pnpm 钉版的 `@deepseek-ai/*` 为准另行核实。
- U2. **welcome 态触发时机**：`connection/reset` 每次重连都发，不能等同「欢迎」；需 grill 决策（首次启用皮肤？素材导入完成？还是不启用该态）。
- U3. **宿主全局 vs session 跟随**：dsh-pet 先例是 host-global 浮层（`client/index.ts:6-10, 284-288`），按上表跟随 `sessions.list.current` 即可；若 DESIGN.md 要求跟随「非当前但有活动」的会话（如后台跑完提醒），可用 `summary.running/pendingInteraction/completed` 列表行信号（`service.ts:58-62`）做聚合，需 grill 确认范围。
