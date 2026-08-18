# 姜晓 · 墨金卷轴 / 宣纸梅花 — 设计文档

> 唐风二次元 · 黑金鎏金卷轴银杏深色 + 宣纸梅花浅色双主题
> 事实源：`.temp/skin-preview/index.html` demo（已确认） + `tokens.css` 设计令牌

## 1. 设计哲学

沿用 openCodeMM 姜晓的唐风二次元语言，重新设计为极致炫技 + 极致性能的皮肤：

- **深色"墨金卷轴银杏"**：墨黑为底，鎏金流光，银杏叶飘落，卷轴质感，金箔文字，朱砂印章
- **浅色"宣纸梅花"**：宣纸为底，水墨晕染，梅花飘落，墨色楷书，朱砂印章

核心原则：**深底亮字，对比度天然达标**（修复原 jiangxiao 侧边栏屎黄色 #b8860b 背景导致文字不可读的问题）。

## 2. 色板

### Surface 表面色阶
| 令牌 | 深色 | 浅色 | 用途 |
|------|------|------|------|
| `--jx-surface-0` | `#0b090d` | `#faf5ee` | 最深底色 |
| `--jx-surface-1` | `#121016` | `#f5eddf` | 基础层 |
| `--jx-surface-2` | `#1a1620` | `#efe3d0` | 升起层 |
| `--jx-surface-3` | `#2d242f` | `#e8dcc8` | 最高层 |

### Text 文字色阶
| 令牌 | 深色 | 浅色 |
|------|------|------|
| `--jx-text-strong` | `#f2ead8` | `#2a241a` |
| `--jx-text-base` | `#f2ead8` | `#5d4a42` |
| `--jx-text-weak` | `#a99c8a` | `#7d6a5e` |
| `--jx-text-faint` | `#8a7e6e` | `#8a7765` |

### Gold 金族
| 令牌 | 深色 | 浅色 |
|------|------|------|
| `--jx-gold-bright` | `#f6d365` | `#9c7a1e` |
| `--jx-gold` | `#d6b34a` | `#b8860b` |
| `--jx-gold-deep` | `#b8860b` | `#8a6508` |
| `--jx-gold-dim` | `#996515` | `#6f5306` |
| `--jx-ginkgo` | `#dfb793` | `#b8860b` |
| `--jx-gold-foil` | `135deg, #f6d365, #fda085, #b8860b` | `135deg, #b8860b, #d97a8e, #8a6508` |

### Seal 印章族 + Cinnabar 朱砂
| 令牌 | 深色 | 浅色 |
|------|------|------|
| `--jx-seal` | `#c7493a` | `#8e3a49` |
| `--jx-seal-deep` | `#a8382b` | `#7a2a39` |
| `--jx-seal-bright` | `#d85444` | `#d97a8e` |
| `--jx-seal-ink` | `#fff8ef` | `#fff8f6` |
| `--jx-cinnabar` | `#c3272b` | `#8e3a49` |

### 代码语法高亮
| 令牌 | 深色 | 浅色 | 用途 |
|------|------|------|------|
| `--jx-kw` | `#d6b34a` | `#8a6508` | 关键字 |
| `--jx-str` | `#86b08a` | `#3d7a3d` | 字符串 |
| `--jx-fn` | `#7fd8e8` | `#2c6a7a` | 函数名 |
| `--jx-cmt` | `#8a7e6e` | `#8a7765` | 注释 |
| `--jx-num` | `#f6d365` | `#9c7a1e` | 数字 |

## 3. 字体

| 令牌 | 字体栈 | 用途 |
|------|--------|------|
| `--jx-font-display` | Ma Shan Zheng, Kaiti SC, STKaiti, KaiTi, serif | 标题/印章/诗句 |
| `--jx-font-ui` | Noto Serif SC, Songti SC, SimSun, serif | 正文/UI |
| `--jx-font-code` | ui-monospace, JetBrains Mono, Cascadia Code, Consolas | 代码 |

## 4. 动效系统

所有动画走 **transform / opacity GPU 合成**，零 backdrop-filter，`prefers-reduced-motion` 全禁用。

| 动效 | 实现 | 时长 | 性能 |
|------|------|------|------|
| 银杏叶/梅花飘落 | 8 片独立 SVG，`translate3d + rotate + opacity`，各异轨迹/速度/延迟 | 18-28s | `will-change: transform, opacity`，父容器 `contain: strict` |
| 鎏金流光顶栏 | `@property --gold-angle` + `conic-gradient(from var(--gold-angle))` 旋转 | 12s | 1 合成层 |
| 金箔文字流光 | `background-clip: text` + `@property --shimmer-x` + `background-position` 位移 | 4s | 文字不重排 |
| 墨晕呼吸 | `@property --breathe` + 双层 `radial-gradient` opacity 呼吸 | 8s | 1 合成层 |
| 朱砂印章脉冲 | `box-shadow` 红晕光呼吸 | 3s | 印章按钮独立 |
| 三点脉冲 | 3 金点 `opacity` 依次脉冲，错开 0.2s | 1.2s | 指示器 |
| 角色发光背光 | `drop-shadow` + `radial-gradient` 呼吸 | 6s | 角色舞台 |
| 消息淡入 | `translateY(8px) + opacity` | 0.5s | 入场一次 |

### 飘落叶/花 SVG

**银杏叶**（深色）：扇形带柄 + 5 条叶脉，3 色（`#d6b34a` / `#dfb793` / `#b8860b`）
**梅花**（浅色）：5 瓣旋转 72deg x5 + 花蕊圆，3 色（`#d97a8e` / `#e89aa8` / `#b24a5c`）

## 5. 布局

三栏 Grid，与 DSH 官方界面一致：

```
grid-template-columns: 220px 1fr 220px;
grid-template-areas: "sidebar main files";
```

- **左侧 220px**：会话导航（工作区标题 + 会话列表 + 新建按钮）
- **中间 1fr**：对话消息流 + 底部输入区（输入框 + 模型选择 + 插件选择 + 朱砂印章发送）
- **右侧 220px**：文件浏览器（文件树）
- **右下角悬浮**：姜晓角色动画（WebP 10 态 + 台词气泡 + 状态切换）
- **右缘**：竖排诗句"海上生明月 / 天涯共此时"

## 6. 组件规格

### 消息气泡
- **用户消息**：金边气泡（`gold-deep 42%` 边框 + 内 `gold-deep 12%` 描边），烫金文字 + 4px 光晕，圆角 `12px 12px 2px 12px`
- **AI 消息**：黑漆卷轴（左->右 渐变 + `gold-deep 8%` 混入），左侧 2px 金线，圆角 `2px 12px 12px 2px`

### 代码块
- 背景 `--jx-code-bg`，边框 `--jx-code-border`，圆角 8px
- 头栏：语言标签（金色）+ 文件名，`surface-2 80%` 背景
- 语法高亮：5 色令牌（kw/str/fn/cmt/num）

### 输入区
- 宣纸笺质感：`border-deco 94% + gold-deep 6%` -> `surface-2` 渐变，内阴影 24px 金晕
- 烫金文字 + 6px 光晕
- 底部工具栏：插件选择 + 模型选择（金线边框下拉）
- 朱砂印章发送钮：圆形 44px，hover 上移 1px，active scale(0.96)，红晕脉冲呼吸

### 印章标 SVG
烫金箔渐变圆边框 + 四向星芒点饰 + 楷书「信」字（左亻亮金 + 右言暗金）+ 紫瞳点睛（radialGradient 紫色眼眸 + 高光 + 瞳孔）

### 角色动画
- 10 态循环 WebP（idle/thinking/reading/replying/working/error/welcome/done/permission/listening）
- 36 态枢纽制过渡 WebP
- 金色发光背光（drop-shadow 16px + radial-gradient 呼吸）
- 楷书台词气泡（金边，淡入动画）
- 10 个状态切换按钮

## 7. 性能策略

| 策略 | 实现 |
|------|------|
| GPU 合成 | 所有动画用 `transform` / `opacity`，不用 `box-shadow` / `background-position` 做大面积动画 |
| `will-change` | 飘落叶/花标记 `will-change: transform, opacity` |
| `contain` | 装饰层 `contain: strict`，顶栏 `contain: layout paint` |
| `@property` | 注册 `--gold-angle` / `--shimmer-x` / `--breathe` 做平滑动画 |
| 零 backdrop-filter | 不用玻璃态模糊（GPU 贵），用纯色 + 渐变模拟 |
| 数量限制 | 飘落叶/花 <= 8 片 |
| `prefers-reduced-motion` | 禁用所有动画 + 隐藏飘落叶 |

## 8. 对比度修复（相对原 jiangxiao）

原 jiangxiao 侧边栏 `--dsw-specific-sidebar-fill: #b8860b`（屎黄色），文字对比度仅 2.5-2.8，远低于 WCAG AA 4.5。

本设计侧边栏改用 `surface` 色阶（深色 `#121016`->`#0b090d` / 浅色 `#f5eddf`->`#faf5ee`），金色退居为 active accent / 边框 / 装饰点缀，文字对比度立即达标。