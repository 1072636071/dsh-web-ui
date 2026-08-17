# 导入错误消息 i18n 化

**Status:** ready-for-agent

**Blocked by:** 05（导入路由 `import.ts` + `routes.ts` 已存在）

**构建内容：** `importPetZip` 函数返回的硬编码中文错误消息改为使用 `locales.ts` 已定义的翻译键。UI 错误文案经 i18n 通道，使英文界面也显示正确英文错误提示。

**验收标准：**

- [ ] `import.ts` 中 `importPetZip` 返回 i18n 翻译键而非硬编码中文文本
- [ ] `locales.ts` 中 `pet.importExists` 等翻译键已定义且被使用
- [ ] `routes.ts` 透传错误消息时正确解析 i18n 键
- [ ] 英文界面显示英文错误提示，中文界面显示中文错误提示
- [ ] 导入路由测试覆盖 i18n 错误消息
- [ ] `pnpm test` 全绿

## 评论

（源自代码审查工单 14：硬编码中文错误消息，`locales.ts` 已定义翻译键却未使用，违反双语纪律）