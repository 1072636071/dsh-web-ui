# 添加 @property 声明到 monorepo jiangxiao

**Status:** ready-for-agent

**Blocked by:** 01

**构建内容：** 在 monorepo jiangxiao 中注册 3 个 @property 可动画自定义属性（--gold-angle/--shimmer-x/--breathe），与 dsh-web-ui-jx 的 base.css 对齐。此工单完成后，monorepo 版本具备与增强版相同的 CSS 动画属性注册，为未来可能的 FX 特效扩展奠定基础。

**验收标准：**

- [ ] @property --gold-angle（syntax: '<angle>'，initial-value: 0deg）已注册
- [ ] @property --shimmer-x（syntax: '<percentage>'，initial-value: 100%）已注册
- [ ] @property --breathe（syntax: '<number>'，initial-value: 1）已注册
- [ ] pnpm build 通过
- [ ] @property 声明不影响未启用 FX 的渲染（声明本身无副作用，仅注册属性）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
