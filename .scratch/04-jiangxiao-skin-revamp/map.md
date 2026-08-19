# Map — 04-jiangxiao-skin-revamp

## 已做决策（指针）

- PRD：`PRD.md`（Status: ready-for-agent）
- 设计基准：`.scratch/skin-preview/`（唯一视觉权威——`DESIGN.md` 设计文档 + `tokens.css` 令牌事实源 + `index.html` 已确认 demo；令牌双值表/FX/浮层背光以其为准）
- grill 决策记录：`docs/memorial/002-jiangxiao-skin-revamp/context.md`（8 项决策 Q1-Q9；其中设计基准项已由 2026-08-19 决策切换为 `.scratch/skin-preview/`，其余决策继续有效）
- 2026-08-19 设计基准切换：FX 开关机制保留、视觉对齐设计；角色恢复金色背光、保持自动跟随、不加手动切换按钮
- 素材落地：`docs/adr/0003-jiangxiao-assets-in-repo-as-dev-source-only.md`（入仓仅开发源，运行时走 dsh-pet）
- 事件源调查：`docs/memorial/002-jiangxiao-skin-revamp/sub-task/001-dsh-event-source.md`（ConversationSnapshot 七态映射 + openCodeMM 三件套移植结论）

## 工单前沿

首轮实现已落地；对齐 `.scratch/skin-preview/` 的返工已于 2026-08-19 全部完成。

- resolved：01（素材入仓）、02（令牌对齐 tokens.css）、03（FX 视觉对齐）、04（状态机纯函数）、05（浮层金色背光）、06（DSH 状态跟随）、07（设置卡导入引导）、08（测试/文档/预览收尾）
- 本轮无在办工单；后续视觉微调以 `.scratch/skin-preview/` 为准另开工单
