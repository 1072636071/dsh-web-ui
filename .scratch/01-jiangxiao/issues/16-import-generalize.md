# 导入路径泛化

**Status:** ready-for-agent

**Blocked by:** 05（导入路由 `import.ts` 已存在）

**构建内容：** 移除 `import.ts` 中 `id === "jiangxiao"` 的硬编码校验，使导入路径对其他 webp 宠物可复用。PRD D5 明确"任何 webp 动画宠物都可复用"。

**验收标准：**

- [ ] `import.ts` 中移除 `validatePetManifest` 里对 `id === "jiangxiao"` 的硬编码校验
- [ ] 合法 webp 宠物 manifest（`kind: "animated-webp"`, `states`/`transitions` 结构完整，id 任意合法值）均可通过导入
- [ ] 既有的姜晓导入行为不变（仍可正常导入）
- [ ] 导入测试覆盖非 `jiangxiao` id 的 webp 宠物导入场景
- [ ] `pnpm test` 全绿

## 评论

（源自代码审查工单 16：`import.ts:44` 硬编码 `id === "jiangxiao"` 限制，违反 PRD D5 可复用性要求）