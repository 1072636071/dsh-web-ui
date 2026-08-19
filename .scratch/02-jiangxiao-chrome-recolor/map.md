# 02-jiangxiao-chrome-recolor — 姜晓皮肤 chrome 瘦身与颜色重设计

## 上下文指针

- **PRD**：`.scratch/02-jiangxiao-chrome-recolor/PRD.md`（Status: ready-for-agent）
- **当前设计基准**：`.scratch/skin-preview/`（本轮 chrome 瘦身与 AA 纪律被继承；`--jx-*` 字面量后被 tokens.css 取代）
- **ADR**：`docs/adr/0002-jiangxiao-chrome-trim-and-recolor.md`（D15-D25 决策基线）
- **词汇表**：根目录 `CONTEXT.md`（术语 + D1-D25 决策表，第二轮 D15-D25 在文件下半部）
- **前序 ADR**：`docs/adr/0001-jiangxiao-skin-pet.md`（D1-D14，本轮不修正）
- **前序 PRD**：`.scratch/01-jiangxiao/PRD.md`（皮肤本体 + 宠物，已落地）
- **impeccable 审查**：本轮 D21-D25 来自 impeccable polish + quieter + craft-floor 审查

## 工单清单

| # | 工单 | 文件 | 状态 | 阻塞于 |
| --- | --- | --- | --- | --- |
| 01 | chrome 瘦身与装饰级删除 | `issues/01-chrome-trim.md` | resolved | 无 |
| 02 | 颜色重设计 + gold 拆分 + 浅色加深 | `issues/02-color-redesign.md` | resolved | 无 |
| 03 | 烫金箔引入 | `issues/03-gold-foil.md` | resolved | 02 |
| 04 | 对比度 CI 门禁脚本 | `issues/04-contrast-gate.md` | resolved | 02 |
| 05 | 双语文档与 CHANGELOG 同步 | `issues/05-docs-sync.md` | resolved | 01, 02, 03, 04 |

## 前沿

全部工单已 resolved（2026-08-19 按实际代码核查，详见各工单评论）。注：颜色/烫金箔的最终视觉由 04 轮（`.scratch/04-jiangxiao-skin-revamp/`）按其 skin-preview 设计基准做了归并对齐（如 `--jx-text-gold` 归并到 `--jx-gold`/`--jx-gold-dim` 文字金），此处不再单列返工。

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
