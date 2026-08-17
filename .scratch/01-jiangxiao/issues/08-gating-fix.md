# Gating 修复：移除内置 pet.json

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 移除 `packages/dsh-pet/assets/jiangxiao/pet.json` 内置资产，确保姜晓宠物仅在用户通过 05 导入通道导入资产包后才出现在宠物选择器。未导入时选择器无姜晓，不出现 webp 404 空链。

**验收标准：**

- [ ] `packages/dsh-pet/assets/jiangxiao/` 目录移除（pet.json + hash-manifest.json 从内置资产中删除）
- [ ] registry 启动时不再自动注册姜晓宠物（无 assets 目录时跳过）
- [ ] 导入资产包后（`~/.codex/pets/jiangxiao/` 存在），registry 正常识别并注册姜晓
- [ ] 未导入时选择器不出现姜晓条目（gating 语义正确）
- [ ] 导入后姜晓出现，webp 动画可正常播放（非 404）
- [ ] 既有鲸鱼娘等 spritesheet 宠物不受影响（回归测试全绿）
- [ ] 打包脚本 `pack-jiangxiao-pet.mjs` 仍可正常产出 zip（只移内置 asset，不移打包逻辑）

## 评论

（源自代码审查工单 08：gating 被内置 pet.json 破坏，违反 PRD D3/D4/US-27）