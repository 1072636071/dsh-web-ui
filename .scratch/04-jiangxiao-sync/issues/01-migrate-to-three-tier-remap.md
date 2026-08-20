# 迁移 monorepo jiangxiao 到三级 remap 架构

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** monorepo 的 packages/skins/jiangxiao 从直接覆盖 --dsw-static-* 值的方式改为 --jx-* → --dsw-static/alias/specific 三级 remap 架构，与 dsh-web-ui-jx 架构一致。此工单完成后，两侧令牌的声明位置和 remap 路径对齐，为后续令牌同步扫清架构障碍。

**验收标准：**

- [ ] monorepo jiangxiao CSS 中 body[data-dsh-jiangxiao] 块先声明 --jx-* 令牌值，再通过 --dsw-static/alias/specific 别名 remap
- [ ] 直接覆盖 --dsw-static-* 字面量的旧写法全部移除（改为引用 --jx-*）
- [ ] 浅色覆盖块 body[data-dsh-jiangxiao]:not([data-ds-dark-theme]) 同样使用三级 remap
- [ ] pnpm build 通过，皮肤在 sdh 中渲染正常（色板与 dsh-web-ui-jx 视觉一致）
- [ ] 不引入任何新令牌或新装饰元素（纯架构重构，不改视觉）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
