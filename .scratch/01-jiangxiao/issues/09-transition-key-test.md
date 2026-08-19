# 过渡表 key 分隔符测试对齐

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** 测试 fixture 中过渡表 key 的分隔符从 `→`（U+2192, RIGHTWARDS ARROW）改为 `->`（ASCII 连字符+大于号），与生产 `pet.json` 和 `scheduler.ts` 的 `transitionKey()` 格式一致。增加针对生产格式的 end-to-end 断言，确保测试覆盖真实数据格式。

**验收标准：**

- [ ] `routes.spec.ts` 和 `registry.test.ts` 中所有 fixture 的 transition key 分隔符从 `→` 改为 `->`
- [ ] 使用生产格式数据的测试用例新增（如解析 `pet.json` 格式的 transition key）
- [ ] 全部涉及测试通过（`pnpm test` 全绿）
- [ ] 调度器 `scheduler.ts` 的 `transitionKey()` 函数不变（已是 `->`）

## 评论

- 2026-08-19 核实：`scheduler.ts` 的 `transitionKey()` 用 ASCII `->`；`registry.test.ts` 的过渡 key 已用 `->`（如 `'idle->thinking'`）；`routes.spec.ts` 同理；`scheduler.test.ts` 覆盖生产格式 key。

（源自代码审查工单 09：测试 fixture 用 `→` 而生产数据用 `->`，测试覆盖缺口，引用 PRD D7）