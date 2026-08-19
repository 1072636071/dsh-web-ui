# DSH 状态自动跟随

**Status:** resolved

**Blocked by:** 04, 05

**构建内容：** 浮层状态自动跟随 DSH current 会话：apply 增加 sessions inject，sessions.list.subscribe 跟踪 current 变化，对 current 会话 binding(id).session.subscribe 读 ConversationSnapshot，差分归一化为状态机事件驱动 reduceCharacter。映射优先级 error > permission > working > replying > thinking > done（边沿）> reading（tick 8s）> idle。用户视角：角色随任务实时变化——开始跑变 thinking、输出变 replying、跑工具变 working、出错变 error、待审批变 permission、完成短暂 done 再回 idle。

**验收标准：**

- [x] apply 增加 sessions inject（dsh-task-board 先例路线）
- [x] 只用 ConversationSnapshot 核心字段（running/partial/runningCalls/pending/promptError/lastAgentError/openError），不依赖投影 key
- [x] 跟随 current 会话；切换 current 时状态随之切换
- [x] 映射判定式与 PRD 一致：error（三错误字段非空）> permission（pending 含 approval/question）> working（runningCalls>0）> replying（partial 可见 chunk）> thinking（running 且无 partial）> done（running 边沿 true→false 且无 error/pending）> reading（thinking≥8s 无 chunk，本地 tick）> idle 兜底
- [x] listening 不触发；无会话/无运行时回 idle
- [x] 快照差分 → 归一化事件层与状态机解耦，可单测
- [x] 订阅在皮肤卸载/切换时正确释放，无泄漏

## 评论

- 2026-08-19：已随首轮实现落地（commit aba4b8f）。状态跟随为事件/逻辑层，与视觉设计基准无关；2026-08-19 设计基准切换（对齐 `.scratch/skin-preview/`）不改变状态映射，维持自动跟随（不引入 demo 的手动切换按钮）。
