# 代码异味清理：工厂函数提取

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** `PetSprite.test.tsx` 中 `webpPetDefinition()` 与 `petDefinition()` 两个工厂函数共享相同的 `track()` 内联 helper 和 `tracks` 对象结构（9 个动画轨道，相同 `frames`/`durations`/`loop`/`fallback` 模式）。提取共享工厂函数消除重复。

**验收标准：**

- [ ] 提取共享 `baseTrack()` 或 `spritesheetTracks()` 工厂函数
- [ ] `webpPetDefinition()` 和 `petDefinition()` 均调用共享工厂，仅传入差异字段（`id`/`displayName`/`kind`/`states`/`transitions`）
- [ ] 测试行为不变（重复消除后所有断言仍通过）
- [ ] `pnpm test` 全绿
- [ ] 无其他代码异味引入（如 emoji、命名不规范等）

## 评论

（源自代码审查工单 12：PetSprite.test.tsx 工厂函数重复，Fowler Duplicated Code 异味）