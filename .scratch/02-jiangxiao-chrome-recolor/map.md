# 02-jiangxiao-chrome-recolor — 姜晓皮肤 chrome 瘦身与颜色重设计

## 上下文指针

- **PRD**：`.scratch/02-jiangxiao-chrome-recolor/PRD.md`（Status: ready-for-agent）
- **ADR**：`docs/adr/0002-jiangxiao-chrome-trim-and-recolor.md`（D15-D25 决策基线）
- **词汇表**：根目录 `CONTEXT.md`（术语 + D1-D25 决策表，第二轮 D15-D25 在文件下半部）
- **前序 ADR**：`docs/adr/0001-jiangxiao-skin-pet.md`（D1-D14，本轮不修正）
- **前序 PRD**：`.scratch/01-jiangxiao/PRD.md`（皮肤本体 + 宠物，已落地）
- **impeccable 审查**：本轮 D21-D25 来自 impeccable polish + quieter + craft-floor 审查

## 工单清单

| # | 工单 | 文件 | 阻塞于 |
| --- | --- | --- | --- |
| 01 | chrome 瘦身与装饰级删除 | `issues/01-chrome-trim.md` | 无 |
| 02 | 颜色重设计 + gold 拆分 + 浅色加深 | `issues/02-color-redesign.md` | 无 |
| 03 | 烫金箔引入 | `issues/03-gold-foil.md` | 02 |
| 04 | 对比度 CI 门禁脚本 | `issues/04-contrast-gate.md` | 02 |
| 05 | 双语文档与 CHANGELOG 同步 | `issues/05-docs-sync.md` | 01, 02, 03, 04 |

## 前沿

无阻塞工单：**01**（chrome 瘦身）、**02**（颜色重设计）。两条线可并行推进：
- chrome 瘦身线：01 → 05
- 颜色重设计线：02 → 03 / 04 → 05

01 和 02 都改 `jiangxiao.module.css`，但改的不同区域（01 删 chrome class + button/input 规则，02 改 token 字面量值），合并冲突风险中等。建议 01 先做（删东西快，让 CSS 更干净），02 后做。

## 已做决策

- D15-D25 全量决策见 `CONTEXT.md` 决策表（下半部）与 `docs/adr/0002-jiangxiao-chrome-trim-and-recolor.md`
- D1-D14（前序）继续生效，本轮不修正

## 决策摘要

| 编号 | 决策 | 工单 |
| --- | --- | --- |
| D15 | 删除两条 chrome 条及附属配置面 | 01 |
| D16 | 装饰级切分对齐 openCodeMM chrome.css 范围 | 01 |
| D17 | --jx-* 深浅双套重设计达 WCAG AA | 02 |
| D18 | gold 族拆分：--jx-text-gold（文字）+ --jx-gold（装饰） | 02 |
| D19 | 浅色 cinnabar/seal 加深为深梅红 | 02 |
| D20 | 对比度 CI 门禁脚本 | 04 |
| D21 | 删除 button 硬编码 box-shadow | 01 |
| D22 | 删除 input 硬编码样式 | 01 |
| D23 | 删除 body padding | 01 |
| D24 | #root 删 border/shadow，保留 transparent | 01 |
| D25 | 烫金箔 background-clip:text 应用于 h1-h4 | 03 |
