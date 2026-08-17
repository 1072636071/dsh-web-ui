# 资产包导入 gating

**Status:** ready-for-agent

**Blocked by:** 02, 04

**构建内容：** 宠物设置卡出现通用"导入资产包…"入口，用户指定本地 zip 后 host 端安全解压到 `~/.codex/pets/jiangxiao/`，姜晓才出现在宠物选择器（gating）；未导入不出现。重复导入被拒，损坏/非法 zip 报错且不污染现有宠物。

**验收标准：**

- [ ] `PetSettingsCard` 宠物选择器旁出现"导入资产包…"入口（file picker 选 zip）
- [ ] host 端新增导入 API：zip → `fflate` 解压 → 路径穿越（zip slip）校验 → `pet.json` 合法性校验 → 解压到 `~/.codex/pets/jiangxiao/`
- [ ] 解压目标含 `pet.json` 声明 `kind: "animated-webp"`；校验失败则回滚不留残留（含半解压目录清理）
- [ ] gating：未导入时选择器无姜晓；导入成功后 registry 识别、姜晓出现（重启生效，D14）
- [ ] 重复导入：目标目录已存在时拒绝并提示"动画包已存在，请先删除旧目录再导入"（D14）
- [ ] 导入路由纯 Node 可测：成功解压、zip slip 拒绝、非法 manifest 拒绝且不残留（新测试，沿用 `registry.test.ts` 模式）
- [ ] 皮肤设置卡提示"下载/导入姜晓动画包后可用"引导文案就绪

**安全约束（勿偏离）：**

- 解压必须做路径穿越校验（zip slip 防护）与 `pet.json` 合法性校验，失败回滚不留残留
- 删除热移除：registry 为启动时快照，删除目录需重启生效，不做文件 watcher

## 评论

（评论与对话历史追加于此，新内容置于最前。）
