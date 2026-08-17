# 01-jiangxiao — 姜晓·墨染 皮肤与姜晓动画宠物

## 上下文指针

- **PRD**：`.scratch/01-jiangxiao/PRD.md`（Status: ready-for-agent）
- **语义审查**：`.scratch/01-jiangxiao/REVIEW.md`（判定：准奏）
- **ADR**：`docs/adr/0001-jiangxiao-skin-pet.md`（D1-D14 决策基线）
- **词汇表**：根目录 `CONTEXT.md`（术语 + D1-D14 决策表）

## 工单清单

| # | 工单 | 文件 | 阻塞于 |
| --- | --- | --- | --- |
| 01 | 姜晓皮肤包（深浅双主题） | `issues/01-skin.md` | 无 |
| 02 | webp 宠物 manifest 契约与 registry 扩展 | `issues/02-manifest.md` | 无 |
| 03 | 过渡调度器（纯函数） | `issues/03-scheduler.md` | 02 |
| 04 | PetSprite 渲染分流 + 状态机接线 | `issues/04-render.md` | 03 |
| 05 | 资产包导入 gating | `issues/05-import.md` | 02, 04 |
| 06 | 打包脚本 + hash-manifest + CI 校验 | `issues/06-pack.md` | 无 |
| 07 | 双语文档与发布同步 | `issues/07-docs.md` | 01, 04, 05, 06 |

## 前沿

无阻塞工单：**01**（皮肤）、**02**（manifest）、**06**（打包）。三条线可并行推进：
- 皮肤线：01 → 07
- 宠物核心线：02 → 03 → 04 → 05 → 07
- 素材线：06 → 07

## 已做决策

- D1-D14 全量决策见 `CONTEXT.md` 决策表与 `docs/adr/0001-jiangxiao-skin-pet.md`
- 素材已落 `local-assets/jiangxiao-pet/`（46 webp，232MB，gitignore）
- 打包脚本产出 `hash-manifest.json` 进仓（D12）
