# release.yml 扩展资产上传

**Status:** ready-for-agent

**Blocked by:** 06（打包脚本 `pack-jiangxiao-pet.mjs` 已就绪，可产出 zip）

**构建内容：** `.github/workflows/release.yml` 增加 `jiangxiao-pet-anim-<version>.zip` 的 asset 上传步骤，复用现有 release 上传链路。使每次发布 tag 时自动附带资产包 zip。

**验收标准：**

- [ ] `.github/workflows/release.yml` 中增加 `pack-jiangxiao-pet.mjs` 运行步骤（生成 zip）
- [ ] 新增 asset 上传步骤：`jiangxiao-pet-anim-<version>.zip` 挂载到 GitHub Release 资产
- [ ] 上传步骤仅在素材目录 `local-assets/jiangxiao-pet/` 存在时执行（CI 跳过）
- [ ] 不破坏现有 release 流程（其他 asset 上传不受影响）
- [ ] 文档（如 Issue 07）同步更新 release 资产说明

## 评论

（源自代码审查工单 17：Issue 06 要求 release.yml 复用资产上传链路，但 diff 中无对应变更）