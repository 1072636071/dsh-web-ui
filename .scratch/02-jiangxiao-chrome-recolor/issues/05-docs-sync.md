# 双语文档与 CHANGELOG 同步

**Status:** ready-for-agent

**Blocked by:** 01, 02, 03, 04

**构建内容：** 姜晓皮肤包的 README（中英配对）和 CHANGELOG 同步反映本轮 chrome 瘦身与颜色重设计的全部变更。用户从 README 能看到当前皮肤的准确形态（无 chrome 条、无 favicon/title 覆盖、无发送钮印章化、有烫金箔标题、有对比度门禁），不再看到已删除的 Configuration 章节的 title/cells 配置面。`pnpm docs:check` 保持绿色。

**验收标准：**

- [ ] README.md 删除：chrome 条描述（title bar / status bar）、Configuration 章节的 `dsh.jiangxiao.title` / `dsh.jiangxiao.cells` 配置面、favicon/title 描述、印章发送钮描述
- [ ] README.md 新增：对比度 CI 门禁说明（`scripts/check-jiangxiao-contrast.mjs` + WCAG AA 标准）
- [ ] README.md 更新：装饰层描述对齐 D16（保留 token remap / 字体 / body 背景纹理 / titlebar-v2 美化 / 滚动条 / selection / headings 烫金箔 / strong-b 亮金 / focus-visible；删除 chrome 条 / 印章发送钮 / favicon / title / button-input 硬编码 / body padding / #root border）
- [ ] README.zh.md 与 README.md 结构镜像（标题层级与顺序、列表条数、表格行列数、链接目标、代码块一一对应）
- [ ] `pnpm docs:write-pair` 重新录 `README.i18n.yaml` hash
- [ ] CHANGELOG.md 追加本次变更记录（chrome 瘦身 + 颜色重设计 + 烫金箔 + 对比度门禁）
- [ ] `pnpm docs:check` 绿（三件套完整、hash 一致、切换行存在、结构签名匹配）
- [ ] `pnpm build` 绿

## 评论

（评论与对话历史追加于此，新内容置于最前。）
