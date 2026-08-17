# CONTEXT.md — 词汇表

本仓库的领域术语与决策词汇。技术值不译；术语一经确定立即登记，避免后续讨论
基于过时定义。

## 主题与皮肤

| 术语 | 定义 |
| --- | --- |
| 姜晓·墨染（Jiangxiao · Ink-Dyed） | 源自 `E:\work\sp\openCodeMM` 的唐风二次元设计系统：墨黑为底、暗金为文、雾紫为氛、朱砂点睛。设计源文件为 openCodeMM 根目录 `DESIGN.md`，`--jx-*` 令牌块（§10 附录）为其唯一落地形式。 |
| jiangxiao 皮肤（本项目形态） | dsh-web-ui 皮肤包 `packages/skins/jiangxiao/`：深色为默认、浅色为变体，单包承载深浅双套令牌，运行时跟随系统/DSH 主题自动切换（决策 A，2026-08-17 grill-with-docs）。 |

## 渲染模型

| 术语 | 定义 |
| --- | --- |
| spritesheet 切帧宠物（dsh-pet） | 宠物渲染模型：单一 atlas 图，192×208 单元格、8 列 × 9 行，固定 9 态行序（idle/running-right/running-left/waving/jumping/failed/waiting/running/review）。`pet.json` + atlas 注册即可新增宠物。 |
| 独立 WebP 动画角色（openCodeMM） | 姜晓角色素材：46 个独立 WebP（10 循环态 + 36 过渡），透明底 9:16，15fps，`<img>` 播放，状态机驱动。与 spritesheet 切帧模型不兼容，不能直接塞进 pet.json。 |
| webp 二次压缩无收益（实测） | 姜晓素材 `idle.webp` 5523KB，gzip -9 后 5522KB（ratio≈1.0）。webp 帧内熵编码已近最优，zstd/gzip 二次压缩不会显著减小体积。"压缩归档"只解决文件管理与分发形态，不解决包体体积。 |

## 已定决策（grill-with-docs 2026-08-17）

### 深浅切换信号（实施约束）

| 术语 | 定义 |
| --- | --- |
| DSH 深色标记 | `body[data-ds-dark-theme]`：DSH 官方深色信号（xp/git-graph 等皮肤同款用法）。姜晓皮肤浅色变体选择器 = `body[data-dsh-jiangxiao]:not([data-ds-dark-theme])`（或等价反转），深色 = `body[data-dsh-jiangxiao][data-ds-dark-theme]`。openCodeMM 的 `html[data-theme="jiangxiao"][data-color-scheme="light"]` 两套令牌映射到这两个选择器。 |

| 决策 | 内容 |
| --- | --- |
| D1 皮肤形态 | 单皮肤包 `jiangxiao` 承载深浅双套令牌，运行时跟随系统/DSH 主题自动切换（选项 A）。 |
| D2 宠物渲染路径 | 扩展 dsh-pet 渲染层支持"独立 WebP 动画宠物"新类型；姜晓作为 built-in pet 注册，鲸鱼娘保留可选（选项 A）。 |
| D3 素材策略 | 全量 46 个 WebP 素材（不丢弃、不降采样），**独立资产包分发 + gating**：用户导入资产包后姜晓宠物才出现在宠物选择器，未导入则不出现（选项 C1 + B 变体）。webp 二次压缩无收益，不做压缩归档。 |
| D4 资产包导入 | 提供 UI 入口让用户**指定本地资产包文件**（选项 B 变体）；host 端解压到 `~/.codex/pets/jiangxiao/`，registry 自动识别。分发渠道 = 手动指定文件，不做下载按钮。 |
| D5 导入入口位置 | dsh-pet 的 `PetSettingsCard` 宠物选择器旁放通用"导入资产包…"按钮；姜晓皮肤只在设置卡提示"下载姜晓动画包后可用"（选项 A）。 |
| D6 资产包格式与解压 | zip 格式 + `fflate` 库解压（选项 A）。纯 JS 零依赖、树摇友好、host 端不经 shell，跨平台无坑。 |
| D7 webp 动画 manifest 与渲染 | `kind: "animated-webp"` 新类型，**完整纳入 10 循环态 + 36 过渡态**（选项 B）：渲染层做完整状态机播放过渡动画，移植 openCodeMM 枢纽制过渡（ADR-013 §2）——以待机为枢纽，`idle→X` 正放 + `X→idle` 倒放，前端按过渡表查路径播放。 |
| D8 动画映射与过渡策略 | pet 动画 → 姜晓循环态映射已定：idle→idle、running→thinking、running-right→working、review→replying、waiting→listening、jumping→done、failed→error、running-left（保留位）→idle、waving（保留位）→welcome。过渡播放：枢纽制查表（直达 1 段 / 经 idle 中转 2 段 / 无素材 crossfade 兜底），快速连续切换用"播放 key 作废"机制打断旧过渡。 |
| D9 皮肤 CSS 形态 | **token 级移植**（选项 A）：把 `--jx-*` 令牌语义映射到 dsh 三层 token（`--dsw-static-*`/`--dsw-alias-*`/`--aion-*`），深色默认 + `body[data-dsh-jiangxiao][data-ds-dark-theme]` 浅色变体，天然支持深浅跟随；装饰级（印章发送钮、标题栏纹样、favicon、金线）按 openCodeMM chrome/session 选择性移植。 |
| D10 字体策略 | **内置字体到皮肤包**（选项 A）：两个 woff2（mashanzheng 1.64MB + notoserifsc 1.38MB ≈ 3MB）作为皮肤 assets 入库，构建打进皮肤包，离线可用；`@font-face` 保留 local() 回退链。 |
| D11 资产分发形态 | 皮肤保持单 bundle 架构：CSS 经 tsdown 打进 `lib/client.js`（css-module，`<style data-plugin>` 注入）；字体作为 base64 data URL 内联进 art 模块（沿用 miku 的 `MIKU_ART` 模式），经 `/api/skin-center/bundle/<id>` 单文件 serve；try-on 与运行时同源。代价：字体 base64 放大 1.33×，client.js +4MB（可接受）。角色 webp 不走皮肤 bundle，走 dsh-pet 资产通道（`~/.codex/pets`）。 |
| D12 素材源持有（D2 修正） | 素材源放**本地项目** `local-assets/jiangxiao-pet/`（46 webp，232MB，gitignore 不上库）；打包脚本 `scripts/pack-jiangxiao-pet.mjs` 引用该目录；`hash-manifest.json`（46 文件 sha256 + 字节数 + zip sha256）进仓作为不可变版本清单。zip 挂 GitHub release 资产（复用 release.yml 上传链路）。CI 柔性门禁：脚本 `--check` 校验任意 zip 与清单一致，不强制 CI 从零构建。 |
| D13 过渡态打包范围（D3 修正） | 36 个过渡文件**全部打包**（素材完整性），渲染层过渡表**只索引 pet 可达的 10 态间路径**；涉及微表情态端点（cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave）与 pet 不可达态（permission/reading）的过渡文件保留在包中、不进渲染层过渡表、不参与调度。 |
| D14 边界场景定案（D1 修正） | 重复导入：目标目录已存在时**拒绝导入**并提示"动画包已存在，请先删除旧目录再导入"；删除热移除：registry 为启动时快照，删除目录需**重启生效**，不做文件 watcher；webp 加载策略：**按需拉取当前状态文件 + 切换时预取目标态**，加载完成前占位 fade-in。 |
