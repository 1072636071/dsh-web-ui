# 01-jiangxiao — 姜晓·墨染 皮肤与姜晓动画宠物

## 上下文指针

- **PRD**：`.scratch/01-jiangxiao/PRD.md`（Status: ready-for-agent）
- **当前设计基准**：`.scratch/skin-preview/`（皮肤视觉已在 04-jiangxiao-skin-revamp 重做对齐；本轮宠物交付链不受设计基准影响）
- **语义审查**：`.scratch/01-jiangxiao/REVIEW.md`（判定：准奏）
- **ADR**：`docs/adr/0001-jiangxiao-skin-pet.md`（D1-D14 决策基线）
- **词汇表**：根目录 `CONTEXT.md`（术语 + D1-D14 决策表）
- **代码审查**：`.temp/code-review-20260817-141243.diff`（审查产出 10 个补救工单）

## 工单清单

| # | 工单 | 文件 | 状态 | 阻塞于 |
| --- | --- | --- | --- | --- |
| 01 | 姜晓皮肤包（深浅双主题） | `issues/01-skin.md` | resolved | 无 |
| 02 | webp 宠物 manifest 契约与 registry 扩展 | `issues/02-manifest.md` | resolved | 无 |
| 03 | 过渡调度器（纯函数） | `issues/03-scheduler.md` | resolved | 02 |
| 04 | PetSprite 渲染分流 + 状态机接线 | `issues/04-render.md` | resolved | 03 |
| 05 | 资产包导入 gating | `issues/05-import.md` | resolved | 02, 04 |
| 06 | 打包脚本 + hash-manifest + CI 校验 | `issues/06-pack.md` | resolved | 无 |
| 07 | 双语文档与发布同步 | `issues/07-docs.md` | resolved | 01, 04, 05, 06 |
| 08 | Gating 修复：移除内置 pet.json | `issues/08-gating-fix.md` | resolved | 无 |
| 09 | 过渡表 key 分隔符测试对齐 | `issues/09-transition-key-test.md` | resolved | 无 |
| 10 | 皮肤设置卡补全导入引导文案 | `issues/10-skin-guide-text.md` | resolved | 无 |
| 11 | WebP 加载占位透明度修复 | `issues/11-webp-placeholder.md` | resolved | 无 |
| 12 | 代码异味清理：工厂函数提取 | `issues/12-smell-factory-extract.md` | resolved | 无 |
| 13 | 代码异味清理：fileHashes 提取 | `issues/13-smell-filehashes-extract.md` | resolved | 06 |
| 14 | 导入错误消息 i18n 化 | `issues/14-import-i18n.md` | resolved | 05 |
| 15 | 不可达态防御断言 | `issues/15-unreachable-assert.md` | resolved | 03 |
| 16 | 导入路径泛化 | `issues/16-import-generalize.md` | resolved | 05 |
| 17 | release.yml 扩展资产上传 | `issues/17-release-yml-asset.md` | resolved | 06 |

## 前沿

全部工单已 resolved（2026-08-19 按实际代码核查，详见各工单评论）。本组实现线（皮肤线 / 宠物核心线 / 素材线 / 补救线）均已落地；皮肤视觉后续由 04 轮（`.scratch/04-jiangxiao-skin-revamp/`）按 `.scratch/skin-preview/` 对齐到最新，此处不再单列工单。

## 已做决策

- D1-D14 全量决策见 `CONTEXT.md` 决策表与 `docs/adr/0001-jiangxiao-skin-pet.md`
- 素材已落 `local-assets/jiangxiao-pet/`（46 webp，232MB，gitignore）
- 打包脚本产出 `hash-manifest.json` 进仓（D12）