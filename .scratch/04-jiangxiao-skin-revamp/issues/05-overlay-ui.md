# 角色浮层 UI + 按需加载 + 降级链

**Status:** ready-for-agent

**Blocked by:** 04

**构建内容：** 右下角常驻角色浮层：透明无底容器（无背景/无阴影/无背光），img 播放当前态 webp，状态切换按 getTransitionPath 播过渡段（缺段 crossfade），台词气泡淡入淡出后自动隐去。素材经 dsh-pet /pet/jiangxiao/<file> 加载，按需加载（当前态 + 预取下一段，不预载全部 46 个）。未导入素材时浮层不渲染。用户视角：角色「住」在界面上，动画顺滑、不占鼠标、不占内存；没导入素材时干干净净。

**验收标准：**

- [ ] 浮层 DOM 直挂 document.body，带可识别标记（更新旧「no DOM chrome」契约）
- [ ] 透明无底：img object-fit contain，容器无 background/box-shadow/光晕/背光
- [ ] pointer-events: none（仅状态相关控件可点）
- [ ] 状态切换播放过渡段，过渡段播完释放（src 置空）；缺段自动 crossfade
- [ ] 只加载当前态 webp + 预取 TRANSITIONS 表列出的下一段；不预载全部
- [ ] 启动探测 /pet/jiangxiao/idle.webp，404 → 浮层不渲染；运行中加载失败 → 回 idle 态
- [ ] 台词气泡 opacity+translateY 淡入淡出，播放后自动隐去
- [ ] 浮层装饰/动画遵守 fx-* 开关与 prefers-reduced-motion

## 评论
