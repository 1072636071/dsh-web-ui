# PRD: 姜晓皮肤重新设计 — 墨金卷轴银杏 / 宣纸梅花

Status: wontfix

> 本轮范围已被 `.scratch/04-jiangxiao-skin-revamp/` 全量吸收：皮肤按本设计（`.scratch/skin-preview/`）落地了令牌 / FX / 角色浮层 / 素材链，剩余对齐返工见 04 轮工单（02/03/05/08）。本文件保留为设计缘起记录，不再单独派工。

## 问题陈述

现有 jiangxiao 皮肤侧边栏使用 `#b8860b`（屎黄色）作为整片背景色，导致侧边栏文字（"工作区"等标签）对比度仅 2.5-2.8，远低于 WCAG AA 标准 4.5，用户反馈"工作区三个字都看不见了，其他字也看不太清"。用户希望放弃原有皮肤设计，沿用唐风哲学（黑金鎏金卷轴银杏深色 + 梅花浅色）重新设计一套极致炫技 + 极致性能的皮肤，并融入 openCodeMM 原项目的姜晓角色动画效果。

## 解决方案

重新设计 jiangxiao 皮肤，保留唐风二次元设计语言但全新实现：

- **深色"墨金卷轴银杏"**：墨黑底 + 鎏金流光 + 银杏叶飘落 + 卷轴质感 + 金箔文字 + 朱砂印章
- **浅色"宣纸梅花"**：宣纸底 + 水墨晕染 + 梅花飘落 + 墨色楷书 + 朱砂印章
- 侧边栏改用 surface 色阶（非屎黄色），金色退居装饰点缀，对比度达标
- 融入原 openCodeMM 姜晓角色 WebP 动画（10 态循环 + 36 过渡 + 台词气泡）
- 三栏布局与 DSH 官方界面一致（左导航 + 中对话 + 右文件浏览器）
- 所有动画走 GPU 合成（transform/opacity），@property 平滑动画，contain 隔离，prefers-reduced-motion 支持

## 用户故事

1. 作为 DSH 用户，我想要侧边栏文字清晰可读，以便我能快速找到目标会话
2. 作为 DSH 用户，我想要深色主题有唐风墨金质感，以便工作时沉浸于古典美学氛围
3. 作为 DSH 用户，我想要浅色主题有宣纸梅花质感，以便白天阅读时柔和不刺眼
4. 作为 DSH 用户，我想要银杏叶/梅花飘落动画，以便界面有生命力但不分散注意力
5. 作为 DSH 用户，我想要鎏金流光顶栏，以便标题区有炫技视觉冲击
6. 作为 DSH 用户，我想要金箔渐变标题文字，以便标题有烫金质感
7. 作为 DSH 用户，我想要朱砂印章发送按钮，以便发送动作有仪式感
8. 作为 DSH 用户，我想要姜晓角色动画在界面中展示，以便有 AI 伙伴的陪伴感
9. 作为 DSH 用户，我想要角色状态随对话变化（思考/回复/工作等），以便直观感知 AI 状态
10. 作为 DSH 用户，我想要角色台词气泡，以便了解角色当前状态的诗意描述
11. 作为 DSH 用户，我想要竖排诗句装饰，以便界面有唐风文学韵味
12. 作为 DSH 用户，我想要三栏布局与官方一致，以便操作习惯统一
13. 作为 DSH 用户，我想要右侧文件浏览器，以便查看项目文件结构
14. 作为 DSH 用户，我想要底部模型/插件选择，以便切换推理模型和工具
15. 作为 DSH 用户，我想要代码块有语法高亮，以便阅读代码
16. 作为 DSH 用户，我想要用户消息有金边气泡和烫金文字，以便区分用户输入
17. 作为 DSH 用户，我想要 AI 消息有黑漆卷轴质感，以便区分 AI 回复
18. 作为 DSH 用户，我想要输入框有宣纸笺质感和烫金文字，以便输入时有书写感
19. 作为 DSH 用户，我想要皮肤在低性能设备上也流畅，以便不因动画卡顿影响工作
20. 作为 DSH 用户，我想要 prefers-reduced-motion 时禁用动画，以便无障碍访问
21. 作为 DSH 用户，我想要金色发光焦点环，以便键盘导航时清晰看到焦点位置
22. 作为 DSH 用户，我想要金线滚动条，以便滚动时有唐风细节
23. 作为 DSH 用户，我想要忙碌三点脉冲指示，以便感知 AI 正在处理
24. 作为 DSH 用户，我想要主题切换按钮，以便随时在深色/浅色间切换

## 实现决策

- 皮肤通过 CSS 变量重映射到 DSH 三层 token 系统（`--dsw-static-*` / `--dsw-alias-*` / `--aion-*`），不改 DOM 结构
- 侧边栏背景改用 `--jx-surface-1` -> `--jx-surface-0` 渐变（非 `--jx-gold-deep`），金色仅用于 active accent / 边框 / 装饰
- 飘落叶/花用独立 SVG 元素 + CSS `transform translate3d + rotate + opacity` 动画（非 background-position），每片独立轨迹
- 鎏金流光用 `@property --gold-angle` + `conic-gradient(from var(--gold-angle))` 旋转动画
- 金箔文字用 `background-clip: text` + `@property --shimmer-x` + `background-position` 位移
- 墨晕呼吸用 `@property --breathe` + 双层 `radial-gradient` opacity 动画
- 朱砂印章按钮：hover `translateY(-1px)` + active `scale(0.96)` + `box-shadow` 红晕脉冲
- 角色 WebP 通过 `<img>` 播放，10 态切换 + 36 过渡（枢纽制），台词气泡淡入
- 角色素材复用 openCodeMM `public/character/*.webp`（10 循环 + 36 过渡）
- 印章标 SVG 复用 openCodeMM `mark.svg`（烫金箔 + 紫瞳 + 星芒 + 信字）
- 三栏 Grid 布局：`220px 1fr 220px`（侧边栏 + 主区 + 文件浏览器）
- 代码语法高亮 5 色令牌：kw/str/fn/cmt/num
- 字体：楷书标题（Ma Shan Zheng）+ 宋体正文（Noto Serif SC）+ 等宽代码
- 零 backdrop-filter，用纯色 + 渐变模拟质感
- `prefers-reduced-motion` 禁用所有动画 + 隐藏飘落叶

## 测试决策

- 皮肤 apply/dispose 契约测试：body 属性设置/移除，无 DOM chrome 注入（参照现有 `tests/apply.spec.ts`）
- 对比度验证：侧边栏文字在侧边栏背景上的 WCAG 对比度 >= 4.5（AA）
- 主题切换测试：深色/浅色切换后所有令牌正确覆写
- 动画性能：飘落叶/花数量 <= 8，所有动画元素有 will-change 或 contain
- prefers-reduced-motion：动画禁用 + 飘落叶隐藏
- 先例：参照 `packages/skins/jiangxiao/tests/apply.spec.ts` 的挂载/销毁测试模式

## 超出范围

- 推翻 skins/ 架构重写皮肤加载/聚合/画廊机制（落地阶段再决定新建包 vs 替换 jiangxiao vs 推翻架构）
- 角色 WebP 素材重新制作（复用现有素材）
- 字体 woff2 打包（demo 阶段用系统字体 fallback）
- 画廊预览图生成
- README 双语维护
- CI 门禁适配（aggregate/gallery/skin-center/docs:check）

## 补充说明

- demo 已确认：`.scratch/skin-preview/index.html`
- 设计令牌：`.scratch/skin-preview/tokens.css`
- 设计文档：`.scratch/skin-preview/DESIGN.md`
- 姜晓动画素材源头：openCodeMM `public/character/*.webp`（10 循环 + 36 过渡）；素材现已按 ADR-0003 入仓 `packages/skins/jiangxiao/assets/character/`（仅开发源，运行时走 dsh-pet）
- 原项目 ADR-034 已下线背景装饰，但 CSS keyframes 和 SVG 代码仍保留可复用
- 落地方式已定案：保留 skin-center 皮肤形态、在现有 jiangxiao 皮肤包上重做（不新建包、不推翻架构），由 `.scratch/04-jiangxiao-skin-revamp/` 实施