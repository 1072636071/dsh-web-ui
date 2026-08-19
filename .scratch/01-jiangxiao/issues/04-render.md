# PetSprite 渲染分流 + 状态机接线

**Status:** resolved

**Blocked by:** 03

**构建内容：** 浏览器端按 `definition.kind` 分流渲染：spritesheet 型走既有切帧路径，webp 型用 `<img>` 播放循环态 + 过渡序列（接入 03 调度器），点击/投喂/改名/拖动/隐藏等既有交互在两种类型上同样可用。姜晓作为内置宠物（资产直通）出现在选择器并可播放全部动画。

**验收标准：**

- [ ] `PetSprite` 按 `definition.kind` 分流：spritesheet 走既有 `spritesheet.ts` 路径（回归无影响），webp 走新渲染路径
- [ ] webp 渲染：`<img>` 播放循环态，切换时按调度器播放过渡序列（直达/中转/crossfade 兜底），key 作废打断生效
- [ ] 按需拉取 + 切换预取目标态；加载完成前占位 fade-in，无首帧空白（D14）
- [ ] 点击/投喂/改名/拖动/隐藏/召唤/会话气泡等既有交互在 webp 型上全部可用
- [ ] 姜晓作为内置宠物出现在宠物选择器（资产直通，gating 由 05 接入），10 态动画随会话活动正确切换
- [ ] `PetSprite.test.tsx` 扩展：webp 型 `<img>` src 断言、spritesheet 回归、交互可用性断言全绿

**参考（来自 PRD D8/D14，勿偏离）：**

- pet 动画 → 姜晓循环态：`idle→idle, running→thinking, running-right→working, review→replying, waiting→listening, jumping→done, failed→error, running-left→idle, waving→welcome`
- 加载策略：按需拉取当前状态 + 切换预取目标态；加载前占位 fade-in

## 评论

- 2026-08-19 核实：`PetSprite.tsx` 已按 `definition.kind` 分流，webp 走 `<img>` + 调度器过渡序列 + key 作废打断；点击/喂食/改名/拖动/隐藏/会话气泡等交互在 webp 型上可用；`PetSprite.test.tsx` 断言 webp `<img>` src、spritesheet 回归、交互可用性。姜晓以「导入后出现」替代「内置直通」（see 05/08 gating 语义）。

（评论与对话历史追加于此，新内容置于最前。）
