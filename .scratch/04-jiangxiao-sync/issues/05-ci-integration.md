# 将 parity 检查集成到 CI

**Status:** ready-for-agent

**Blocked by:** 02, 03, 04

**构建内容：** 将 token parity 检查集成到 monorepo 的 CI 门禁流程中。当 monorepo jiangxiao 的 --jx-* 令牌与 dsh-web-ui-jx 不同步时，CI 构建失败并输出差异报告。此工单完成后，每次提交都会自动验证令牌一致性，防止不同步的代码合入。

**验收标准：**

- [ ] aggregate:check 扩展调用 parity 脚本，或新增独立 pnpm parity:check 脚本
- [ ] CI 配置（GitHub Actions 或等效）包含 parity 检查步骤
- [ ] parity 检查失败时 CI 退出码非零，阻止合并
- [ ] parity 检查通过时 CI 正常继续
- [ ] README 或 docs 中记录 parity 检查的用途和手动运行方式

## 评论

（评论与对话历史追加于此，新内容置于最前。）
