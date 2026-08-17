# PRD: 姜晓·墨染 皮肤与姜晓动画宠物

Status: ready-for-agent

领域词汇见仓库根目录 `CONTEXT.md`；本 PRD 遵守 `docs/adr/0001-jiangxiao-skin-pet.md`。

## 问题陈述

dsh-web-ui 的用户希望把 `E:\work\sp\openCodeMM` 项目中沉淀的「姜晓·墨染」唐风二次元设计系统（DESIGN.md 与 `--jx-*` 令牌）带进 dsh Web GUI，获得深浅双主题皮肤；同时用同一设计体系下的姜晓角色动画素材（46 个独立 WebP，10 循环态 + 36 过渡态）替换默认鲸鱼娘宠物。素材体量大（46 WebP 约 232MB），不应随主插件包分发；动画模型（独立 WebP + 枢纽制过渡）与现有宠物渲染模型（spritesheet 切帧）不兼容，需要扩展渲染层。

## 解决方案

两个独立交付物：

1. **姜晓皮肤**（`jiangxiao`）：单皮肤包承载深浅双套令牌。深色为默认（月夜墨染：墨黑底、暗金文、雾紫氛、朱砂点睛），浅色为梅花变体（米白底、粉梅、金），运行时跟随 DSH 深浅信号自动切换。CSS 按 token 级移植（`--jx-*` → dsh 三层 token），装饰级（印章发送钮、标题栏纹样、favicon、金线）选择性移植；2 个 woff2 字体内置进包，离线可用。

2. **姜晓动画宠物**：dsh-pet 渲染层扩展 `kind: "animated-webp"` 新类型，完整支持独立 WebP 状态机 + 枢纽制过渡播放。姜晓角色作为**独立资产包**（zip）分发给用户；用户经宠物设置卡的"导入资产包…"入口指定本地 zip，host 端解压到自定义宠物目录后，姜晓才出现在宠物选择器（gating）。未导入则不可用，鲸鱼娘保留可选。

## 用户故事

### 皮肤

1. 作为 dsh Web GUI 用户，我想要在皮肤中心看到并启用「姜晓·墨染」皮肤，以便把唐风二次元风格应用到整个界面。
2. 作为用户，我想要皮肤在系统/DSH 处于深色模式时呈现深色「月夜墨染」变体，以便符合深底浅字阅读习惯。
3. 作为用户，我想要皮肤在系统/DSH 处于浅色模式时自动切换为浅色「梅花」变体，以便深浅跟随主主题，无需手动切换。
4. 作为用户，我想要皮肤中心预览同时展示深浅两态截图，以便在启用前判断两套配色是否符合预期。
5. 作为用户，我想要界面正文、面板、输入区、按钮、滚动条、选中态、链接等全部组件获得一致的唐风配色，以便观感统一不跳色。
6. 作为用户，我想要发送按钮呈现朱砂印章圆钮、标题栏带唐风纹样、favicon 与文档标题匹配主题，以便核心元素有装饰点缀。
7. 作为用户，我想要代码块/语法高亮保持 DSH 上游专业配色，以便代码可读性不受主题装饰影响。
8. 作为用户，我想要皮肤安装后离线可用（含楷体/宋体字体），以便无网络环境观感一致。
9. 作为用户，我想要尝试穿戴（try-on）与正式启用看到一致的效果，以便预览所见即所得。
10. 作为用户，我想要切回官方默认皮肤后皮肤注入的样式、装饰、标题与 favicon 全部干净还原，以便不留残留。

### 宠物

11. 作为用户，我想要在宠物设置卡看到姜晓（若已导入资产包），以便替换默认鲸鱼娘。
12. 作为用户，我想要姜晓动画宠物在待机时播放 idle 循环，以便提供陪伴感。
13. 作为用户，我想要会话思考时姜晓播放 thinking 动画，以便视觉反馈推理进行中。
14. 作为用户，我想要工具执行时姜晓播放 working 动画，以便反映工作状态。
15. 作为用户，我想要回复流式输出时姜晓播放 replying 动画，以便反映生成过程。
16. 作为用户，我想要等待输入时姜晓播放 listening 动画，以便反映期望用户操作。
17. 作为用户，我想要回合完成时姜晓播放 done 庆祝动画并随后回到待机，以便获得完成感。
18. 作为用户，我想要出错时姜晓播放 error 动画，以便直观反映异常。
19. 作为用户，我想要状态切换时播放对应枢纽制过渡动画（idle→X 正放、X→idle 倒放），以便切换自然不生硬。
20. 作为用户，我想要快速连续状态切换时新目标立即打断旧过渡，以便不堆积延迟动画。
21. 作为用户，我想要点击姜晓获得互动反馈气泡，以便保留宠物交互乐趣。
22. 作为用户，我想要投喂、改名、拖动、隐藏/召唤等既有宠物交互在姜晓上同样可用，以便无缝替换。
23. 作为用户，我想要姜晓动画宠物与鲸鱼娘可在宠物选择器中自由切换，以便保留原有宠物。
24. 作为用户，我想要在宠物设置卡看到"导入资产包…"入口，以便指定本地姜晓动画 zip。
25. 作为用户，我想要导入的 zip 被安全解压到自定义宠物目录（`~/.codex/pets`），以便 registry 自动识别、无需重启。
26. 作为用户，我想要导入损坏或不含合法 `pet.json` 的 zip 时得到明确错误提示且不污染现有宠物，以便失败可诊断。
27. 作为用户，我想要未导入资产包时宠物选择器中不出现姜晓，以便 gating 语义清晰。
28. 作为用户，我想要姜晓皮肤设置卡提示"下载/导入姜晓动画包后可用"，以便引导激活宠物。

### 素材与分发

29. 作为维护者，我想要一个资产包打包规范（46 WebP + `pet.json` + 目录结构）与可复现校验（`hash-manifest.json` + `--check`），以便可复现地构建并校验分发 zip。
30. 作为维护者，我想要资产包 zip 可经现有 `~/.codex/pets` 通道识别，以便不引入新的宠物源。

## 实现决策

### D1 皮肤形态

单皮肤包 `jiangxiao`，深色默认、浅色变体，运行时跟随 DSH 深浅信号。深浅信号为 `body[data-ds-dark-theme]`；浅色变体选择器 = `body[data-dsh-jiangxiao]:not([data-ds-dark-theme])`，深色 = `body[data-dsh-jiangxiao][data-ds-dark-theme]`。openCodeMM 的 `html[data-theme="jiangxiao"][data-color-scheme="light"]` 两套令牌映射到这两个选择器。

### D2 渲染层扩展

dsh-pet manifest 新增 `kind: "animated-webp"` 类型；渲染层按 kind 分流——spritesheet 型走既有切帧路径，webp 型走独立 WebP 状态机路径。鲸鱼娘等既有 spritesheet 宠物完全不受影响（默认 kind 缺省回退 spritesheet 契约）。

### D3/D4 资产包与 gating

- 全量 46 WebP 不丢弃、不降采样；webp 二次压缩无收益（实测 gzip ratio≈1.0），不做压缩归档。
- 素材源持有（D12，D2 审查修正）：46 个 webp 放**本地项目** `local-assets/jiangxiao-pet/`（gitignore 不上库）；打包脚本 `scripts/pack-jiangxiao-pet.mjs` 引用该目录生成 `pet.json` + zip；`hash-manifest.json`（46 文件 sha256 + 字节数 + zip sha256）进仓作不可变版本清单；zip 挂 GitHub release（复用 `release.yml` asset 上传链路）。
- 资产包以 zip 分发；用户经 UI 指定本地文件，不做下载按钮。
- host 端解压到 `~/.codex/pets/jiangxiao/`（含 `pet.json` + 素材），registry 自动扫描识别。未导入则不注册、不出现在选择器。
- 解压必须做路径穿越校验（zip slip 防护）与 `pet.json` 合法性校验，失败回滚不留残留。
- 重复导入语义（D1 定案）：目标目录 `~/.codex/pets/jiangxiao/` 已存在时**拒绝导入**并提示"动画包已存在，请先删除旧目录再导入"，避免半覆盖残留。
- 删除热移除（D1 定案）：registry 扫描为启动时快照，用户手动删除目录后**需重启生效**（不做文件 watcher）；删除后选择器不再出现姜晓。
- 可复现校验：`scripts/pack-jiangxiao-pet.mjs --check <zip>` 校验任意 zip 与 `hash-manifest.json` 一致；CI 柔性门禁校验清单格式与脚本存在性，不强制 CI 从零构建（素材不在 checkout）。

### D5 导入入口

入口放 dsh-pet 宠物设置卡（`PetSettingsCard`）的通用"导入资产包…"按钮；任何 webp 动画宠物都可复用。姜晓皮肤设置卡只做引导提示文案。

### D6 解压实现

zip 格式 + `fflate` 库解压（纯 JS 零依赖、树摇友好、host 端不经 shell、跨平台无坑）。这是 dsh-pet 新增的唯一运行时依赖。

### D7 webp 动画 manifest 与过渡调度

新类型完整纳入 10 循环态 + 36 过渡态（素材 D3 定案：36 个过渡文件**全部打包**，作为素材集完整性的不可变清单）。

渲染层移植 openCodeMM 枢纽制过渡（ADR-013 §2）：以待机为枢纽，`idle→X` 正放 + `X→idle` 倒放；无直达段时经 idle 中转 2 段；无素材时 crossfade 兜底。过渡表查路径为纯函数。

**过渡态打包范围（D3 审查定案）**：36 过渡文件全部保留进包，但渲染层过渡表**只索引 pet 可达的 10 态间路径**（D8 映射表的 10 个循环态）。涉及微表情态端点（cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave）及 pet 不可达态（permission/reading）的过渡文件**保留在包中但进入渲染层过渡表**——它们不被索引、不参与调度，仅作为素材完整性保留。

manifest 决策密集片段（type shape，源自 openCodeMM 过渡表结构）：

```ts
// webp 动画宠物的动画声明（kind: "animated-webp"）
interface WebpPetAnimation {
  kind: 'animated-webp'
  // 10 个循环态 → 文件（相对 pet.json 目录）
  states: Record<JiangxiaoState, string>
  // 过渡表：key "<from>→<to>" → 文件 + 时长（ms）
  transitions: Record<string, { webp: string; durationMs: number }>
}

type JiangxiaoState =
  | 'idle' | 'thinking' | 'reading' | 'replying' | 'working'
  | 'error' | 'welcome' | 'done' | 'permission' | 'listening'
```

### D8 动画映射与过渡策略

pet 动画 → 姜晓循环态映射（决策密集片段）：

```ts
// pet 9 态契约 → 姜晓循环态
const PET_TO_JIANGXIAO: Record<PetAnimation, JiangxiaoState> = {
  idle: 'idle',
  running: 'thinking',      // thinking
  'running-right': 'working', // tool
  review: 'replying',
  waiting: 'listening',
  jumping: 'done',
  failed: 'error',
  'running-left': 'idle',   // 状态机不产出，保留位
  waving: 'welcome',        // 状态机不产出，保留位
}
```

过渡播放策略：枢纽制查表（直达 1 段 / 经 idle 中转 2 段 / 无素材 crossfade 兜底）；快速连续切换用"播放 key 作废"机制——新目标立即打断旧过渡。过渡调度为纯函数（S1 seam），输入 `(当前动画, 目标动画, 过渡表)`，输出 `(过渡文件序列, 终态循环文件)`。

webp 加载策略（D1 定案）：**按需拉取当前状态文件**，切换时预取目标态文件；webp 加载完成前以占位（不透明 fade-in）呈现，避免首帧空白。

### D9 皮肤 CSS 形态

token 级移植：`--jx-*` 令牌语义 → dsh 三层 token（`--dsw-static-*` 静态 / `--dsw-alias-*` 别名 / `--aion-*` aionui），深色默认 + `body[data-dsh-jiangxiao][data-ds-dark-theme]` 变体。装饰级（印章发送钮、标题栏纹样、favicon、金线分隔、云纹底纹）按 openCodeMM chrome/session 选择性移植。代码块/语法高亮保持 `--syntax-*` 不改。禁裸色值、禁发明中间值；`prefers-reduced-motion` 下动效全关。

### D10 字体策略

内置 2 个 woff2（mashanzheng 1.64MB + notoserifsc 1.38MB ≈ 3MB）到皮肤包，离线可用；`@font-face` 保留 local() 回退链（`local("楷体")` / `local("SimSun")` 等）。

### D11 资产分发形态

皮肤保持单 bundle：CSS 经 tsdown 打进 `lib/client.js`（css-module，`<style data-plugin>` 注入）；字体作为 base64 data URL 内联进 art 模块，经 `/api/skin-center/bundle/<id>` 单文件 serve；try-on 与运行时同源。字体 base64 放大 1.33×，client.js +4MB（可接受）。角色 webp 不走皮肤 bundle，走 dsh-pet 资产通道。

### Seam（测试接入点，已与用户确认）

| # | Seam | 类型 | 说明 |
| --- | --- | --- | --- |
| S1 | 过渡调度器（新模块，纯 TS） | 主 seam | `(当前动画, 目标动画, 过渡表)` → `(过渡文件序列, 终态循环文件)`。枢纽制查表 + key 作废，无 DOM。 |
| S2 | `registry` manifest 解析 | 复用已有 seam | `resolvePetManifest` 增加 `kind: "animated-webp"` 分支。 |
| S3 | `state` 动画映射 | 复用已有 seam | `animationForPhase` 的 pet 动画 → 姜晓循环态映射。 |
| S4 | `PetSprite` 渲染分流 | 复用已有 seam | jsdom 断言 `<img>` 按调度输出切换 src。 |
| S5 | zip 导入路由 | 已有 seam 扩展 | host 端 API 端点，纯 Node 可测（fflate 解压 + 路径穿越校验）。 |

皮肤侧不设 seam（纯 CSS token remap + base64 art，无逻辑）。

## 测试决策

- **好测试的标准**：只测外部行为，不测实现细节。过渡调度器测输入→输出的组合（直达/中转/无素材/crossfade 兜底/打断作废）；manifest 解析测合法与非法输入（含路径穿越、缺字段、非法 id）；渲染分流测 `<img>` 的 src 与可见性；导入路由测解压成功、zip slip 拒绝、非法 manifest 拒绝且不残留。
- **被测模块**：过渡调度器（S1）、`registry`（S2）、`state`（S3）、`PetSprite`（S4）、导入路由（S5）。
- **测试先例**：dsh-pet 现有 vitest 套件——`registry.test.ts`（Node 临时目录 + 安全校验断言）、`state.test.ts`（时钟注入状态机）、`PetSprite.test.tsx`（jsdom + @testing-library/react，`prefers-reduced-motion` 冻结动画）。新测试沿用这些模式。
- **皮肤**：无逻辑 seam，视觉正确性靠皮肤中心 preview 图（light/dark 两张）验证，不做单测。
- **CI**：全仓 `pnpm test` 门禁必须保持绿色；新增包/依赖同步更新 aggregate 与文档。

## 超出范围

- 不做资产包下载按钮 / CDN 分发（用户手动指定本地文件）。
- 不做 webp 转 spritesheet 或任何二次转码（如 webm/avif）。
- 不做 TTS、角色台词语音。
- 不改 DSH 源码；皮肤/宠物只走 cordis patch + profile 机制。
- 皮肤不重构 DSH 布局骨架（只做视觉层 remap）。
- 不做姜晓角色的"过渡态 B 级扩展段"（cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave 等微表情态）；仅登记核心 10 态 + 36 过渡。微表情态过渡文件保留在包中但不被渲染层索引（D3 定案）。
- 不新增远程 issue tracker。

## 补充说明

- 素材与皮肤来自 openCodeMM（作者自绘/自产），可自由引用派生；角色素材保持透明底、只读原图（派生可、改像素不行）。
- 资产包 zip 需附 `pet.json` 声明 `kind: "animated-webp"`；zip 内禁止符号链接与绝对路径。
- 导入目录固定为 `~/.codex/pets/jiangxiao/`（registry 现有自定义通道，gating 天然成立）。
- 皮肤与宠物分属不同插件，可独立安装/启用；皮肤不依赖宠物、宠物不依赖皮肤。
- 双语文档纪律：皮肤包 README 中英配对，宠物改动同步更新 dsh-pet README；CI docs 门禁必须保持绿色。
