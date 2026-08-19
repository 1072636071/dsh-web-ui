# 不可达态防御断言

**Status:** resolved

**Blocked by:** 03（调度器 `scheduler.ts` 已存在）

**构建内容：** `scheduler.ts` 中 `resolveTransition` 对 `reading`/`permission` 等 pet 不可达态增加防御断言，防止渲染层误传时的静默行为（当前 `from === to` 时返回空序列，缺少明确告知调用者"此状态不可达"的机制）。

**验收标准：**

- [ ] `resolveTransition` 中检测到不可达态（如 `reading`/`permission`）时，触发防御断言或明确错误信号
- [ ] 生产环境不可达态降级为 crossfade 兜底（不 crash），开发环境有明确 warning
- [ ] 映射表 `petToJiangxiao` 注释说明不可达态处理策略
- [ ] 调度器单测覆盖不可达态断言：传入不可达态时的行为
- [ ] `pnpm test` 全绿

## 评论

- 2026-08-19 核实：`scheduler.ts` `resolveTransition` 经 `REACHABLE_STATES` 检查 reading/permission，不可达态降级为 crossfade（返回空序列），dev 打警告、prod 不 crash；`petToJiangxiao` 与 `PET_TO_JIANGXIAO` 注释说明不可达态策略；`scheduler.test.ts` 覆盖不可达态行为。

（源自代码审查工单 15：调度器缺少对不可达态的防御断言，引用 PRD D13）