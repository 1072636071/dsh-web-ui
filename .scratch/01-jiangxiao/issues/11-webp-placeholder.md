# WebP 加载占位透明度修复

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** `PetSprite.tsx` 中 webp 加载前的占位样式从 `opacity: 0.5`（半透明）改为不透明占位，符合 PRD D14 要求。加载前用户看到的是不透明占位区域，加载完成后平滑 fade-in 过渡。

**验收标准：**

- [ ] `PetSprite.tsx` 中 webp 加载前占位从 `opacity: 0.5` 改为不透明（如 `opacity: 1` + 占位背景色或纯色块）
- [ ] 加载完成后保留 fade-in 过渡效果（不丢失已有动画）
- [ ] 加载前不露出背景内容（半透明问题已修复）
- [ ] `PetSprite.test.tsx` 中 webp 占位相关断言更新
- [ ] `pnpm test` 全绿

## 评论

（源自代码审查工单 11：PRD D14 要求"不透明 fade-in"，实现为 `opacity: 0.5` 半透明露出背景内容）