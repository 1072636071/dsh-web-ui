# 双语文档与发布同步

**Status:** ready-for-agent

**Blocked by:** 01, 04, 05, 06

**构建内容：** 皮肤包与宠物扩展的双语文档与发布清单同步：皮肤包 README 中英三件套、dsh-pet README 更新 webp 类型与导入说明、聚合/发布清单同步，`pnpm docs:check` 等全部门禁绿色。

**验收标准：**

- [ ] 姜晓皮肤包 README 中英配对：`README.md`（英文）+ `README.zh.md`（中文）+ `README.i18n.yaml`（配对一致性），`pnpm docs:write-pair` 重录
- [ ] dsh-pet README 更新：webp 宠物类型、资产包导入使用说明、gating 语义、重复导入/重启生效行为
- [ ] `docs/` 与根 README 提及姜晓皮肤与宠物（如发布清单、packages 布局），触及处同步更新
- [ ] 资产包打包/导入的维护者文档（打包脚本用法、hash-manifest、release 挂载）
- [ ] `pnpm docs:check` 全绿；`pnpm aggregate:check`/`skin-center:check` 涉及时同步
- [ ] ADR-0001 引用与 CONTEXT.md 词汇保持一致（决策 D12/D13/D14 已记录）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
