# 同步缺失的 --jx-* 令牌（深浅双值）

**Status:** ready-for-agent

**Blocked by:** 01

**构建内容：** 在 monorepo jiangxiao 的三级 remap 架构基础上，补全所有 dsh-web-ui-jx 中已有但 monorepo 版本缺失的 --jx-* 令牌（深浅双值齐全）。补全后两侧的令牌集合完全对齐，任何消费 --jx-* 令牌的组件（如代码块语法高亮、唐风楷体标题）在两个版本中表现一致。

**验收标准：**

- [ ] 暗色块补全以下令牌组（值与 dsh-web-ui-jx 完全一致）：code-syntax 7 色（code-bg/code-border/kw/str/fn/cmt/num）、typography 3 族（font-display/font-ui/font-code）、motion 9 时长、radius 5、shadow 3、layout 2、petal 装饰色 4、ink-glow
- [ ] 浅色覆盖块同步补全对应的浅色值
- [ ] pnpm build 通过
- [ ] token parity 脚本（工单 04）运行后对 --jx-* 令牌报告零差异

## 评论

（评论与对话历史追加于此，新内容置于最前。）
