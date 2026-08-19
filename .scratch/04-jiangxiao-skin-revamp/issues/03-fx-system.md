# FX 特效系统视觉对齐 + 设置卡开关

**Status:** resolved

**Blocked by:** 02

**构建内容：** FX 开关机制不变——五效（shimmer 鎏金流光 / fall 银杏梅花飘落 / grain 墨韵暗纹 / breathe 墨晕呼吸 / micro 微交互）仍由 html 上 fx-* 类 + localStorage('jx-fx') 控制，默认全开、可独立关、全关 = 与原版皮肤零差异，皮肤设置卡提供开关 UI。本工单返工的是每效的视觉实现，使其与 `.scratch/skin-preview/` 设计（DESIGN.md §4 动效系统 + index.html demo）一致。用户视角：酷炫特效与 demo 观感一致，性能敏感时仍可逐项关闭且偏好被记住。

**验收标准：**

- [ ] 五效各自可由 fx-* 类独立开关，默认全开；开关状态持久化到 localStorage('jx-fx')，重启保持
- [ ] html 无任何 fx-* 类时移除全部 animation/transition/装饰层，与原版无差异；prefers-reduced-motion 下全部强制关闭
- [ ] fall：银杏（暗）/梅花（浅）飘落 **≤8 片独立 SVG**，各异轨迹/速度/延迟（时长 18-28s），`translate3d + rotate + opacity` GPU 合成，`will-change: transform, opacity`，父容器 `contain: strict`；不再是 12 片
- [ ] grain：墨韵暗纹为**静态多层 radial-gradient（`--jx-ink-glow`）零热循环**，不再用 SVG turbulence
- [ ] shimmer：鎏金流光顶栏（`@property --gold-angle` + conic-gradient 旋转）+ 金箔文字流光（`background-clip: text` + `@property --shimmer-x`）
- [ ] breathe：墨晕呼吸（`@property --breathe` + 双层 radial-gradient opacity 呼吸）
- [ ] micro：朱砂印章脉冲（box-shadow 红晕呼吸）、忙碌三点脉冲（opacity 错开 0.2s）、消息淡入（translateY + opacity）、hover/active 微交互
- [ ] 零 backdrop-filter；所有动画走 transform/opacity GPU 合成
- [ ] 装饰层 pointer-events: none，不拦截操作
- [ ] 设置卡提供五效开关 UI（消费语义别名，无颜色字面量）；开关文案与新特效含义一致

## 评论

- 2026-08-19：设计基准切换为 `.scratch/skin-preview/`。开关机制（fx-* 类 + localStorage + 设置卡 + 全关零差异 + reduced-motion 强制关）经用户确认**保留**；返工范围是视觉实现——fall 由 12 片 WAAPI 收敛为 ≤8 片独立 SVG，grain 由 SVG turbulence 改为静态墨晕渐变，与 demo 对齐。
- 2026-08-19（落地）：fall 为 8 片 CSS keyframes 飘片（fx-system 注入容器，轨迹/尺寸/时长走 CSS nth-child，18-28s），grain 为 html.fx-grain 门控的静态多层 radial 墨晕，各效时长走令牌；fx-system.spec 新增 8 片容器契约测试，全部通过。
