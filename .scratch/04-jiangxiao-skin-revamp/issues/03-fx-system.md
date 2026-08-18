# FX 特效系统 + 设置卡开关

**Status:** ready-for-agent

**Blocked by:** 02

**构建内容：** 五类特效（shimmer 鎏金流光 / fall 银杏梅花飘落 / grain 墨韵暗纹 / breathe 墨光呼吸 / micro 微交互）按 DESIGN.md §5 实现，html 上 fx-* 类 + localStorage('jx-fx') 控制，默认全开、可独立关、全关 = 与原版皮肤零差异。皮肤设置卡提供开关 UI。用户视角：酷炫特效默认体验，性能敏感时可逐项关闭且偏好被记住。

**验收标准：**

- [ ] 五效各自可由 fx-* 类独立开关，默认全开
- [ ] 开关状态持久化到 localStorage('jx-fx')，重启保持
- [ ] html 无任何 fx-* 类时移除全部 animation/transition/装饰层，与原版无差异
- [ ] prefers-reduced-motion 下全部强制关闭
- [ ] fall 用 Web Animations API + GPU transform（12 片）；grain 静态 SVG turbulence 零热循环
- [ ] 装饰层 pointer-events: none，不拦截操作
- [ ] 设置卡提供五效开关 UI（消费语义别名，无颜色字面量）

## 评论
