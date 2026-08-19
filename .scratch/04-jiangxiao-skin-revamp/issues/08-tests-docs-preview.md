# 测试契约 + 文档/预览同步 + 门禁全绿

**Status:** resolved

**Blocked by:** 02, 03, 05

**构建内容：** 收尾工单：更新皮肤包测试契约（旧「injects no DOM chrome」断言改为「未导入素材时不注入浮层；导入后浮层带可识别标记且含金色背光层」），补齐浮层/FX/设置卡外部行为测试；重拍 preview 深浅预览图（反映墨金卷轴银杏 / 宣纸梅花对齐后视觉，含角色背光）；README 中英三件套与 docs 同步更新（能力：FX 开关、角色浮层金色背光、状态跟随、素材导入引导、tokens.css 令牌对齐）；跑通仓库门禁。用户视角：皮肤中心里的预览与文档如实反映新皮肤，仓库 CI 全绿。

**验收标准：**

- [ ] apply 测试契约更新：未导入素材 → 无浮层 DOM；导入后 → 浮层标记存在且含背光层断言
- [ ] 新增外部行为测试：fx-* 类切换与 localStorage 持久化、fall ≤8 片装饰层节点数断言、降级链（404 不渲染/失败回 idle）、设置卡就绪/未就绪两态
- [ ] 只测外部行为，不测 CSS 色值等实现细节
- [ ] preview/dark.png 与 preview/light.png 重拍，反映对齐 `.scratch/skin-preview/` 后的视觉（含角色背光）
- [ ] README.md / README.zh.md / README.i18n.yaml 三件套同步（pnpm docs:write-pair 重录配对）
- [ ] skin.json 描述/tagline 更新（FX 可关、角色浮层金色背光、状态跟随、双主题）
- [ ] pnpm typecheck && pnpm test && pnpm docs:check && pnpm skin-center:check 全绿
- [ ] 提交信息遵循 Conventional Commits，无 emoji

## 评论

- 2026-08-19：设计基准切换为 `.scratch/skin-preview/`。首轮实现已产出过一版测试/预览/文档，本工单随返工（02/03/05）同步更新；浮层契约在「透明无容器底」基础上补「金色背光层」断言。
- 2026-08-19（落地）：apply/overlay/tokens/fx 契约全部更新；preview dark/light 经 scripts/capture-previews 重拍为真实渲染截图（gallery 模拟器补 react shim 后可加载本皮肤 bundle）；README 三件套 + docs:write-pair 重录、skin.json/CHANGELOG 更新；typecheck / test / test:scripts / docs:check / skin-center:check / aggregate:check / gallery:check 全绿。
