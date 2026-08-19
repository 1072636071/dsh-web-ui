# 端到端验证：两仓均构建并部署到 sdh

**Status:** ready-for-agent

**Blocked by:** 02, 03

**构建内容：** 分别验证 dsh-web-ui-jx（独立仓库）和 monorepo packages/skins/jiangxiao 均能成功构建并通过各自的验收流程，然后分别 link 到 sdh（deepseek-harness）验证渲染正确。此工单是整个同步工作的最终验收——确保两侧令牌对齐后不影响任何一方的构建和部署。

**验收标准：**

- [ ] dsh-web-ui-jx: npm run build 成功（host + client 双半区产物非空）
- [ ] dsh-web-ui-jx: npm run verify 21 项检查全部通过
- [ ] dsh-web-ui-jx: dsh plugin --profile web add link 成功，sdh 渲染正常
- [ ] monorepo jiangxiao: pnpm build 成功
- [ ] monorepo jiangxiao: pnpm dsh plugin --profile web add link 成功，sdh 渲染正常
- [ ] 两侧在 sdh 中切换暗/亮主题后色板视觉一致（目视检查关键色：surface/text/gold/seal）
- [ ] token parity 脚本（工单 04）运行后报告零差异

## 评论

（评论与对话历史追加于此，新内容置于最前。）
