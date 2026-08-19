# 角色浮层恢复金色背光 + 按需加载 + 降级链

**Status:** resolved

**Blocked by:** 04

**构建内容：** 返工右下角常驻角色浮层的视觉层：在保持透明无容器底的前提下**恢复金色发光背光**——`drop-shadow`（金色光晕，对齐 demo 的 16px 量级）+ `radial-gradient` 呼吸背光（`--breathe` 驱动，约 6s），对齐 `.scratch/skin-preview/index.html` 的 `.character-stage` 视觉。其余契约不变：img 播放当前态 webp，状态切换按 getTransitionPath 播过渡段（缺段 crossfade），台词气泡淡入淡出后自动隐去。素材经 dsh-pet /pet/jiangxiao/<file> 加载，按需加载（当前态 + 预取下一段，不预载全部 46 个）。未导入素材时浮层不渲染。**不加手动状态切换按钮**（demo 的 10 按钮为预览便利）。用户视角：角色「住」在界面上、有一圈柔和金色背光，动画顺滑、不占鼠标、不占内存；没导入素材时干干净净。

**验收标准：**

- [ ] 浮层 DOM 直挂 document.body，带可识别标记（data-jx-overlay="character"）
- [ ] 透明无容器底：img object-fit contain，容器无 background；**背光是 drop-shadow + radial-gradient 光晕层，不是容器背景色**
- [ ] 金色发光背光存在且呼吸（对齐 demo .character-stage 的 drop-shadow + ::before radial-gradient 呼吸）；受 prefers-reduced-motion 约束（reduced-motion 下停止呼吸动画）
- [ ] 不引入手动状态切换按钮；状态仍由 DSH 自动跟随驱动（见工单 06）
- [ ] pointer-events: none（仅状态相关控件可点）
- [ ] 状态切换播放过渡段，过渡段播完释放（src 置空）；缺段自动 crossfade
- [ ] 只加载当前态 webp + 预取 TRANSITIONS 表列出的下一段；不预载全部
- [ ] 启动探测 /pet/jiangxiao/idle.webp，404 → 浮层不渲染；运行中加载失败 → 回 idle 态
- [ ] 台词气泡 opacity+translateY 淡入淡出，播放后自动隐去；气泡为金边楷书质感（对齐 demo .character-bubble）
- [ ] 浮层装饰/动画遵守 fx-* 开关与 prefers-reduced-motion

## 评论

- 2026-08-19：设计基准切换为 `.scratch/skin-preview/`。用户确认**恢复金色发光背光**、**保持自动跟随**（不加手动切换按钮）。首轮实现的「透明无底、无背光」浮层需在本工单补上背光层；透明无容器底、按需加载、降级链等契约维持不变。
- 2026-08-19（落地）：背光层 data-jx-backlight 独立于容器（radial 金色光晕 + WAAPI 6s 呼吸），img 带 drop-shadow 金色光晕；台词气泡升级金边楷书；背光经 html.fx-breathe 门控、reduced-motion 下静态。character-overlay.spec 契约更新（含背光断言），全部通过。
