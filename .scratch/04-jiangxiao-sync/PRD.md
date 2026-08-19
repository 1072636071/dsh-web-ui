# 姜晓皮肤双仓同步规格

> Status: ready-for-agent

## 问题陈述

姜晓唐风皮肤存在两个独立实现：

1. **dsh-web-ui-jx**（独立仓库 `1072636071/dsh-web-ui-jx`）：增强版，包含完整 FX 特效系统（shimmer/fall/grain/breathe/micro）、角色浮层状态机、侧边栏入口、台词气泡，以及完整的 `--jx-*` 令牌体系（code-syntax/typography/motion/radius/shadow/layout/petal/cinnabar/ink-glow）。
2. **dsh-web-ui/packages/skins/jiangxiao**（monorepo 子包 `@linxin666/dsh-client-ui-skin-jiangxiao`）：基础版，仅有 token remap + 基础装饰（朱砂印章、金描滚动条），令牌体系不完整（缺少 code-syntax、typography、motion 等令牌），且采用直接覆盖 `--dsw-static-*` 值的方式（无 `--jx-*` 中间层）。

两者架构差异导致：
- 设计令牌值不一致（如 monorepo 版本缺少 `--jx-cinnabar`、`--jx-ink-glow`、`--jx-code-bg` 等）
- 令牌的中间层架构不同（dsh-web-ui-jx 用 `--jx-*` → `--dsw-*` 三级 remap；monorepo 直接覆盖 `--dsw-static-*`）
- 改进无法自动同步，手动维护成本高且易漏

## 解决方案

两个仓库保持独立（不合并），通过定期同步机制保持设计令牌对齐：

- **dsh-web-ui-jx** 作为设计事实源（source of truth）：所有 `--jx-*` 令牌的定义和 FX 特效增强在此开发
- **dsh-web-ui/packages/skins/jiangxiao** 作为发布渠道：从 dsh-web-ui-jx 同步令牌层，保持与 monorepo 其他皮肤的兼容性
- **Token parity 脚本** 作为验证 seam：自动化检测两侧令牌声明差异，CI 门禁拦截不同步

## 用户故事

1. 作为姜晓皮肤开发者，我想要在 dsh-web-ui-jx 中修改一个 `--jx-*` 令牌值后，monorepo 版本能自动同步该变更，以便两个版本始终保持设计一致
2. 作为 CI 系统，我想要在每次提交时运行 token parity 检查，以便在令牌不同步时阻止合并
3. 作为 dsh-web-ui-jx 用户，我想要安装增强版后看到完整 FX 特效和角色浮层，而 monorepo 基础版用户只看到令牌换色效果，以便按需选择功能深度
4. 作为皮肤中心（skin-center）用户，我想要在皮肤预览中看到准确的姜晓唐风色板，不管是从 monorepo 还是独立仓库安装的版本
5. 作为维护者，我想要一个脚本来检测两侧 `--jx-*` 令牌的差异并输出报告，以便快速定位需要同步的令牌
6. 作为新用户，我想要 monorepo 版本的姜晓皮肤也能覆盖完整的 `--jx-*` 令牌体系（包括 code-syntax、typography、motion 等），以便其他消费 `--jx-*` 令牌的组件能正常工作
7. 作为 dsh-web-ui-jx 的 session-follow 用户，我想要角色状态机能正确跟随会话状态（thinking/replying/working/error 等），且台词气泡使用唐风楷体设计
8. 作为 FX 特效用户，我想要 8 片 SVG 飘落叶片（暗=银杏/浅=梅花）以 18-28s 慢速飘落，而非简单的 CSS 圆角形状
9. 作为 prefers-reduced-motion 用户，我想要所有动画（shimmer 旋转、飘落叶片、呼吸光效、角色背光）自动关闭，以便不触发眩晕或不适
10. 作为 WCAG AA 合规审查者，我想要两侧令牌值的文字对比度都达标（暗色 #1a1620/#f2ead8 > 4.5:1，浅色 #efe3d0/#2a241a > 4.5:1），以便确保可访问性

## 实现决策

### 令牌架构统一

- **dsh-web-ui-jx 的 `--jx-*` → `--dsw-*` 三级 remap 架构作为标准**：所有颜色先定义在 `--jx-*` 命名空间，再通过 `--dsw-static/alias/specific-*` remap 注入宿主
- **monorepo jiangxiao 需要迁移到三级 remap 架构**：将现有直接覆盖 `--dsw-static-*` 值的方式改为先声明 `--jx-*` 再 remap，使两侧架构一致
- **令牌命名空间**：统一使用 `--jx-` 前缀，避免命名冲突

### 令牌集合对齐

- monorepo 版本需补全 dsh-web-ui-jx 中的所有 `--jx-*` 令牌（深浅双值）：
  - 已有：surface 4 色、text 4 色、gold 5 色、seal 4 色、mist/mountain/water/cloud/moon/hair/wisteria 氛围 7 色、cinnabar、success/warn/error 状态 3 色、border-deco/selection/scroll-track/scroll-thumb 装饰 4 色、gold-foil 渐变
  - 缺失需补全：code-syntax 7 色（code-bg/code-border/kw/str/fn/cmt/num）、typography 3 族（font-display/font-ui/font-code）、motion 9 时长（dur-fast/dur/breathe-dur/gold-rotate-dur/shimmer-dur/leaf-fall-min/leaf-fall-max/seal-pulse-dur/bpulse-dur）、radius 5（sm/md/lg/xl/seal）、shadow 3（shadow-1/shadow-2/gold-rim）、layout 2（sidebar-w/files-w）、petal 装饰色 4（petal-1/2/3/poem-color）、ink-glow

### @property 声明同步

- dsh-web-ui-jx 在 base.css 注册了 3 个 @property（--gold-angle/--shimmer-x/--breathe），monorepo 版本需补全以支持平滑 CSS 动画

### FX 特效系统

- **dsh-web-ui-jx 独有**：FX 特效系统（5 类 shimmer/fall/grain/breathe/micro）和角色浮层状态机不需要同步到 monorepo 版本
- **原因**：FX 和角色浮层是增强功能，monorepo 版本定位为轻量级皮肤（仅令牌换色 + 基础装饰）
- **可选**：如果 monorepo 用户需要 FX，可额外安装 dsh-web-ui-jx 作为增强插件

### 角色浮层和侧边栏

- **dsh-web-ui-jx 独有**：CharacterOverlay（140x249 舞台 + 金色背光 + 状态机）、SidebarEntry（左侧 rail + 设置卡）、SpeechBubble（唐风楷体气泡）不需要同步
- **原因**：这些是增强 UI 组件，monorepo 版本不涉及 UI 组件

### Token parity 脚本

- **位置**：`dsh-web-ui/scripts/check-jiangxiao-token-parity.mjs`
- **功能**：读取两侧 jiangxiao.css，提取所有 `--jx-*` 令牌声明，对比值是否一致
- **输出**：差异报告（令牌名、dsh-web-ui-jx 值、monorepo 值）
- **退出码**：0 = 一致，1 = 有差异
- **集成**：CI 门禁（`pnpm aggregate:check` 扩展或独立 `pnpm parity:check`）

### 同步方向与频率

- **方向**：dsh-web-ui-jx → monorepo（增强版是设计事实源）
- **频率**：每次 dsh-web-ui-jx 发布新版本后手动触发同步（或未来可自动化）
- **范围**：仅同步 `--jx-*` 令牌值和 @property 声明，不同步 FX/角色/侧边栏组件代码

### 作用域属性

- 两侧都使用 `body[data-dsh-jiangxiao]` 作为作用域属性
- **不能同时安装**：两者互斥，同时安装会导致令牌覆盖冲突
- **用户选择**：安装 monorepo 版本（轻量）或 dsh-web-ui-jx（增强），不可两者共存

## 测试决策

### Token parity 脚本（核心 seam）

- **测试什么**：两侧 `--jx-*` 令牌声明的值是否完全一致
- **好测试的标准**：脚本能准确检测出任何 `--jx-*` 令牌的值差异（包括缺失令牌），输出可读的差异报告
- **不测什么**：不测 FX 特效、角色浮层、侧边栏等增强功能（这些是 dsh-web-ui-jx 独有的）
- **先例**：dsh-web-ui 已有 `scripts/aggregate.mjs --check`（聚合包一致性检查），parity 脚本遵循相同模式

### 构建兼容性

- **测试什么**：两侧分别构建后都能成功挂载到 sdh（deepseek-harness）宿主
- **先例**：dsh-web-ui-jx 已有 `npm run build` + `npm run verify`（21 项检查），monorepo 已有 `pnpm build`

### 视觉回归

- **测试什么**：令牌值变更后，两侧渲染的色板是否视觉一致
- **方式**：手动视觉检查（自动化视觉对比成本过高，暂不实现）

## 超出范围

- **FX 特效同步**：shimmer/fall/grain/breathe/micro 特效系统不需要同步到 monorepo 版本
- **角色浮层同步**：CharacterOverlay、SpeechBubble、overlay 状态机不需要同步
- **侧边栏入口同步**：SidebarEntry、SettingsCard、管理界面 section 不需要同步
- **合并仓库**：两个仓库不合并，保持独立
- **自动同步脚本**：本期仅实现 parity 检测，不实现自动同步（未来可基于检测结果自动 patch）
- **同时安装兼容**：不支持两个版本同时安装（互斥）
- **sdh 宿主修改**：不修改 deepseek-harness 的任何代码

## 补充说明

- dsh-web-ui-jx 当前已部署到 sdh（`pnpm dsh plugin --profile web add link:D:/work/space/dsh-web-ui-jx`），构建和 21 项验收全部通过
- monorepo 版本（@linxin666/dsh-client-ui-skin-jiangxiao v0.1.0）使用 tsdown 构建，dsh-web-ui-jx 使用 vite 构建，构建工具不同但不影响令牌同步
- monorepo 版本的 CSS 文件是 `.module.css`（CSS Module），dsh-web-ui-jx 的是全局 CSS（`body[data-dsh-jiangxiao]` 选择器），但令牌声明的语法和值相同
- dsh-web-ui-jx 的 `--jx-font-display` 引用 `"JX MashanZheng"`（base.css @font-face 定义），monorepo 版本的字体加载机制可能不同（需确认字体是否可共享）
