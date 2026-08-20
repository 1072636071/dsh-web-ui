# 创建 token parity 验证脚本

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 创建一个 Node.js 脚本（scripts/check-jiangxiao-token-parity.mjs），读取 dsh-web-ui-jx 和 monorepo jiangxiao 两侧的 CSS 文件，提取所有 --jx-* 令牌声明（包括深浅双值），对比值是否一致，输出差异报告。脚本退出码 0 表示一致，1 表示有差异，可集成到 CI。

**验收标准：**

- [ ] 脚本位于 scripts/check-jiangxiao-token-parity.mjs
- [ ] 能正确解析两侧 CSS 文件中的 --jx-* 自定义属性声明（含 linear-gradient 等复杂值）
- [ ] 暗色和浅色令牌分别对比
- [ ] 输出可读的差异报告（令牌名、dsh-web-ui-jx 值、monorepo 值）
- [ ] 两侧一致时退出码 0，有差异时退出码 1
- [ ] 脚本可通过 pnpm parity:check 调用（package.json 新增 script）
- [ ] 脚本自身有基本错误处理（文件不存在时友好报错）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
