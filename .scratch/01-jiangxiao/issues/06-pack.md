# 打包脚本 + hash-manifest + CI 校验

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 维护者能从本地素材目录 `local-assets/jiangxiao-pet/` 一键生成可分发资产包：`scripts/pack-jiangxiao-pet.mjs` 校验 46 个 webp、生成 `pet.json`（`kind: "animated-webp"`）、打 zip，并产出/校验 `hash-manifest.json`（46 文件 sha256 + 字节数 + zip sha256）作为不可变版本清单；`--check` 模式校验任意 zip 与清单一致。

**验收标准：**

- [ ] `scripts/pack-jiangxiao-pet.mjs` 从 `local-assets/jiangxiao-pet/` 生成：`pet.json`（webp 契约）+ zip + `hash-manifest.json`
- [ ] 打包校验：46 文件齐全（10 循环态 + 36 过渡），文件名/数量不符即报错
- [ ] `pet.json` 结构符合 02 契约：`states` 10 循环态 + `transitions` 36 过渡 key
- [ ] `--check <zip>` 校验 zip 内文件哈希与 `hash-manifest.json` 一致；`hash-manifest.json` 进仓作不可变清单
- [ ] CI 柔性门禁：`pnpm test:scripts` 覆盖清单格式校验与 `--check` 逻辑（不强制 CI 从零构建，素材不在 checkout）
- [ ] `release.yml` 上传链路复用：`jiangxiao-pet-anim-<version>.zip` 挂 GitHub release 资产
- [ ] 素材源 `local-assets/` 保持 gitignore（D12，不入库）

## 评论

（评论与对话历史追加于此，新内容置于最前。）
