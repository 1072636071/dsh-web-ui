# 对比度 CI 门禁脚本

**Status:** resolved

**Blocked by:** 02

**构建内容：** 维护者有一个 CI 门禁脚本，自动校验姜晓皮肤的 `--jx-text-*` token 在 `--jx-surface-*` 上的对比度达 WCAG AA。脚本接入 `pnpm test:scripts`，后续任何改动如果让对比度回退到 AA 以下，CI 会变红。脚本解析 `jiangxiao.module.css` 中深浅双套 token 字面量，按 WCAG 对比度公式（相对亮度比值）计算，不依赖浏览器或 jsdom。

**验收标准：**

- [ ] 新建 `scripts/check-jiangxiao-contrast.mjs`，零依赖纯 Node 脚本
- [ ] 脚本解析 `packages/skins/jiangxiao/src/client/jiangxiao.module.css`，提取深色（`body[data-dsh-jiangxiao]`）和浅色（`body[data-dsh-jiangxiao]:not([data-ds-dark-theme])`）两套 `--jx-text-*` / `--jx-surface-*` 字面量
- [ ] 按 WCAG 2.1 对比度公式（相对亮度比值）计算 `--jx-text-strong` / `--jx-text-base` / `--jx-text-gold` 在 `--jx-surface-0` / `-1` / `-2` / `-3` 上的对比度，断言 ≥ 4.5:1
- [ ] 断言 `--jx-text-weak` / `--jx-text-faint` 在各 surface 上 ≥ 3:1
- [ ] 深浅双套都校验
- [ ] 失败时输出具体 token 名、surface 名、实际对比度值、目标值，便于定位修复
- [ ] 接入 `pnpm test:scripts`（沿用 `scripts/aggregate.test.mjs` 等构建时校验脚本模式）
- [ ] `pnpm test:scripts` 绿
- [ ] 脚本对当前 token 值（工单 02 完成后的值）校验通过

## 评论

- 2026-08-19 核实：`check-jiangxiao-contrast.mjs` 零依赖纯 Node，解析深浅双套 `--jx-text-*`/`--jx-surface-*` 字面量，按 WCAG 2.1 校验（strong/base 4.5:1，weak/faint 3:1，含文字金 token），失败输出 token/surface/ratio；`check-jiangxiao-contrast.test.mjs` 包装接入 `pnpm test:scripts`。

（评论与对话历史追加于此，新内容置于最前。）
