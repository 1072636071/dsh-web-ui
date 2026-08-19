# 代码异味清理：fileHashes 提取

**Status:** resolved

**Blocked by:** 06（打包脚本 `pack-jiangxiao-pet.mjs` 已存在）

**构建内容：** `pack-jiangxiao-pet.mjs` 中 `cmdInitManifest()` 和 `cmdPack()` 两个函数重复了构建 `fileHashes` 数组的逻辑（pet.json sha256 + 46 个 webp sha256 + 尺寸，约 12 行）。提取为 `buildFileHashes()` 共享函数。

**验收标准：**

- [ ] 提取 `buildFileHashes(petJsonBytes, files)` 共享函数
- [ ] `cmdInitManifest()` 和 `cmdPack()` 均调用该函数
- [ ] 打包行为不变（`--check` 校验通过，hash-manifest.json 内容一致）
- [ ] `pnpm test:scripts` 全绿（含 `pack-jiangxiao-pet.test.mjs`）
- [ ] 无其他代码异味引入

## 评论

- 2026-08-19 核实：`pack-jiangxiao-pet.mjs` 已提取 `buildFileHashes(petJsonBytes, files)` 共享函数，`cmdInitManifest()` 与 `cmdPack()` 均调用；`pack-jiangxiao-pet.test.mjs` 覆盖 hash-manifest 构建/校验。

（源自代码审查工单 13：pack-jiangxiao-pet.mjs 中 fileHashes 构建重复，Fowler Data Clumps 异味）