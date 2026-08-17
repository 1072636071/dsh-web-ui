# Memorial 001 — jiangxiao-asset-pack

**状态**: 进行中

## 诉求

用户原话：

> 之前的需求做了一个素材导入的功能，皮肤只保留背景图和简单的素材，完整素材需要打包导入。在本项目做一个打包的一个工具，还有一个导入素材的入口。

核心目标：为 dsh-web-ui 的 jiangxiao 皮肤包实现角色 WebP 素材的打包工具 + 导入入口。皮肤包只保留简单素材（CSS 炫技 SVG / 背景图），完整角色动画素材（232MB，46 个 WebP）打包成独立 zip，用户按需导入到 `~/.dsh/assets/jiangxiao/`。

## 已知事实

### 素材源

- **源目录**: `D:\work\space\open-code-mm\opencode\packages\app\public\character\`
- **文件**: 46 个 WebP（10 循环态 + 36 过渡态），共 232MB
- **循环态**: idle / thinking / reading / replying / working / error / welcome / done / permission / listening（5-7MB 每个）
- **过渡态**: `transition-<from>-<to>.webp`（2-7MB 每个）
- **规范**: WebP 动画，9:16 竖版（720x1280 循环 / 722x1274 过渡），15fps，alpha 透明背景，`<img>` 标签播放
- **生成脚本**: `D:\work\space\open-code-mm\scripts\chroma_key_green.py`（ffmpeg chromakey 抠绿 mp4 -> Pillow 合成 WebP）
- **README**: `D:\work\space\open-code-mm\opencode\packages\app\public\character\README.md`

### 皮肤包架构约束

- **包路径**: `packages/skins/jiangxiao/`
- **运行时资产必须 base64 内联**: 所有运行时艺术资产以 data URL 内联在 `src/client/art.ts`，tsdown 编译进单一 `lib/client.js`
- **无外部资产服务机制**: skin-center 只服务 `lib/client.js`（`/api/skin-center/bundle/<id>` 路由），不服务任何其他文件
- **tsdown 不复制二进制资产**: `shared/tsdown.client.ts` 只处理 `.module.css`，不复制 .png/.webp/.woff2 到 lib/
- **232MB WebP base64 内联不可行**: 会生成 ~310MB JS 字符串，浏览器无法解析
- **dragon-heir 参照**: 其 PNG 资产每个 2-2.7MB，base64 内联可行（~3.6MB），但角色素材远超此规模

### 皮肤包当前结构

- `src/index.ts` — host 半区，当前为空（`export function apply(): void {}`）
- `src/client/index.ts` — client 半区，apply() 设置 body 属性 + 注入 @font-face style，不注入 DOM chrome
- `src/client/SkinSettingsCard.tsx` — 设置卡，当前检测 `/api/pet/pets` 判断 jiangxiao pet 是否注册
- `src/client/art.ts` — woff2 字体 base64 内联
- `src/client/jiangxiao.module.css` — 主样式（已含 CSS 炫技：鎏金流光 / 银杏飘落 / 朱砂印章）
- `cordis.patch.yml` — bundle 激活补丁，插入 `ui-skin-jiangxiao` 到 web 插件名册
- `skin.json` — 皮肤元数据
- `package.json` — `files` 字段控制 npm 发布内容（当前: lib / cordis.patch.yml / skin.json / preview / README）

### demo 已确认

- `.temp/skin-preview/index.html` — 三栏布局 + 双主题 + CSS 炫技 + 角色动画 + 10 态切换 + 台词气泡
- 用户已确认 demo "完美"
- 角色动画在 demo 中: 右下角悬浮，140x249px，drop-shadow 金色背光，台词气泡（楷体），10 态切换按钮

## 已确认决策

1. **素材包格式**: .zip（浏览器原生支持解压，无需原生依赖）
2. **素材存放位置**: 复用 dsh-pet 已有链，存 `~/.codex/pets/jiangxiao/`（改原决策，用户确认「修改原来的」）。素材路径可让用户自定义选择（新增需求，细节待澄清）。
3. **导入入口**: 皮肤设置卡按钮（用户选 zip 文件 -> 解压 -> 存放，纯前端流程）
4. **打包工具位置**: `packages/skins/jiangxiao/scripts/pack.mjs`（皮肤包内脚本）
5. **导入/服务链归属**: 复用 dsh-pet 已有链（改原决策）。jiangxiao 皮肤包**不新建 host 半区、不新增路由、不新增依赖**，client 半区引用 `/pet/jiangxiao/<file>`，设置卡从「引导去 pet 卡」改成「内嵌导入按钮调 `/api/pet/import-zip`」。素材存 `~/.codex/pets/jiangxiao/`。

## 追问记录

### 2026-08-17 — 初始化

- 用户确认素材包格式 .zip、存放 ~/.dsh/assets/jiangxiao/、导入入口在设置卡、打包工具在皮肤包内 scripts/pack.mjs
- 发现皮肤包无外部资产服务机制（skin-center 只服务 lib/client.js），232MB WebP 无法 base64 内联
- 用户指示：皮肤只保留简单素材，完整素材打包导入；在本项目做打包工具 + 导入入口
- 尚未开始技术方案 grill，准备切换 agent 上下文

### 2026-08-17 — 续接 + P1 调查闭环

**续接**：按 jxx-grill-with-memorial 续接规则，4 项旧决策视为待验证假设，将逐一重新质疑。P1.1 是阻塞前提（事实问题），委派调研Agent-姜小研 调查（工单 sub-task/001-p1-investigation.md，已闭环）。

### 2026-08-17 — 续接（第二次）

**续接**：续接规则重验。已确认 P1 调查闭环、决策 5 已落盘（jiangxiao 自实现导入/服务链）。但调研工单 Q5 的「额外发现」揭示决策 5 存在一个被低估的替代方案：dsh-pet 已实现完整 jiangxiao 素材导入 + 服务链（存 `~/.codex/pets/jiangxiao/`），复用则 jiangxiao 皮肤包几乎零成本。此决策是全部下游工作的地基，须先从诉求重新质疑，不默认接受。

**P1 调查关键结论**（证据见工单）：

1. **P1.1 浏览器端写文件到 ~/.dsh/**：**可行**。host 半区是 Node 进程，`node:fs` + `dshHome()` 直接写；`ctx.webServer.register` 注册 HTTP 路由接收上传。cordis 不暴露高层 fs 服务，但不需要。
2. **P1.2 素材服务路由**：候选 A（皮肤包自己注册 `/api/skin-jiangxiao/asset/<filename>`）可行且推荐；候选 B（复用 skin-center）不可行（只服务 lib/client.js，跨包耦合）；候选 C（dsh 内置静态服务）无证据。
3. **P1.3 zip 解压**：**fflate** 已被 dsh-pet 采用，仓库已有依赖，直接复用。
4. **重大发现**：**dsh-pet 已实现 jiangxiao 角色素材完整导入 + 服务链**：`POST /api/pet/import-zip` → `importPetZip()` → 写 `~/.codex/pets/jiangxiao/` → `GET /pet/jiangxiao/<file>` 服务（白名单 + MIME）。jiangxiao 皮肤包当前 `SkinSettingsCard` 就是 `fetch('/api/pet/pets')` 引导用户去 pet 设置卡导入。

**新浮现的核心决策**：素材导入/服务链的归属（复用 dsh-pet vs jiangxiao 自实现）。此决策影响旧决策 2/3/4，须先定。

### 2026-08-17 — 续接重验（决策 1：导入/服务链归属）

**续接**：从诉求重新验证地基决策。调研工单 Q5「额外发现」揭示 dsh-pet 已实现完整 jiangxiao 素材链（`POST /api/pet/import-zip` → `~/.codex/pets/jiangxiao/` → `GET /pet/jiangxiao/<file>`），复用几乎零成本，与决策 5（自实现）冲突。

**追问**：呈现 3 方案（复用 dsh-pet / 自实现 / 混合抽共享工具），并指出「存 `~/.dsh/assets/`」可能是在未意识到 dsh-pet 已做完整套链时做的决策。

**用户决策**：「1.修改原来的，然后素材的路径可以让用户自己选择」
- 确认复用 dsh-pet 已有链（方案 1），修改原自实现决策。
- 新增需求：素材路径允许用户自定义选择（细节待澄清，见 P6）。

### 2026-08-17 — P6 路径自选确认

**追问**：浏览器 `<input type="file">` 拿不到绝对路径（安全限制）；dsh-pet 服务链靠 registry 扫描 `~/.codex/pets/` 发现 pet。呈现 3 方案（选 zip 文件 / 选目标目录 / 选全局根）。

**用户决策**：「1+2 都要」——既要导入时选 zip 文件，也要选导入后素材存放的目标目录。

**影响**：
- 导入入口：皮肤卡内嵌，用户①选 zip 文件 ②选（或输入）目标目录。
- dsh-pet 需扩展：`POST /api/pet/import-zip` 当前写死 `join(codexPetsDir(), 'jiangxiao')`（routes.ts 第 362 行），需支持携带 targetDir（query 或 JSON 元数据）；`importPetZip` 的 targetDir 参数已可自定义，但路由层需暴露。
- 服务链风险：`assetHandler` 用 `registry.byId(id)` 解析 entry.dir，registry 只扫描 `codexPetsDir()`（~/.codex/pets/）。若用户自定义 targetDir 在该根之外，服务链发现不了。需调查改动面。
- 待澄清：P6.2（路径 UI）、P6.3（与 pack.mjs 关系）。

## 决策汇总

1. **素材包格式**: .zip
2. **素材存放位置**: 复用 dsh-pet 链，存 `~/.codex/pets/jiangxiao/`；**路径用户自选**（1+2 都要：选 zip 文件 + 选目标目录）
3. **导入入口**: 皮肤设置卡按钮
4. **打包工具位置**: `packages/skins/jiangxiao/scripts/pack.mjs`
5. **导入/服务链归属**: 复用 dsh-pet 已有链（否决自实现）。jiangxiao 皮肤包不新建 host 半区、不新增路由/依赖，client 引用 `/pet/jiangxiao/<file>`，设置卡内嵌导入按钮调 `/api/pet/import-zip`。
6. **导入需扩展 dsh-pet**: `POST /api/pet/import-zip` 需支持自定义 targetDir（当前写死 `~/.codex/pets/jiangxiao/`）；服务链 registry 需能发现自定义目录。改动面待调查（P6 新工单）。

## 待澄清

### P1 — 技术前提（必须先解决，阻塞后续所有工作）

**P1.1 浏览器端如何写入文件到 `~/.dsh/assets/jiangxiao/`**
- 浏览器无法直接写文件到用户目录，需要 host 端 API
- 需要调查：dsh 是否有现成的文件写入/上传 API/服务？cordis 是否暴露文件系统服务？
- 需要调查：皮肤包 host 半区（src/index.ts）能否注册 HTTP 路由？其他插件（dsh-pet / dsh-task-board）如何持久化数据到磁盘？
- 候选方案：A) 皮肤包 host 半区注册上传路由 B) 复用 dsh 已有的文件服务 C) cordis 服务暴露 fs 能力

**P1.2 素材服务路由 — apply() 怎么通过 URL 引用 WebP**
- host 端注册什么路由服务 `~/.dsh/assets/jiangxiao/` 下的 WebP？
- 候选：`/api/skin-jiangxiao/asset/<filename>` 或复用 skin-center 某路由
- 需要确认 skin-center routes.ts 能否扩展，或皮肤包自己注册路由

**P1.3 zip 解压方案 — 浏览器端用什么库**
- 候选：A) fflate（~8KB，轻量） B) JSZip（~44KB，流行） C) DecompressionStream API（原生，但 zip 需要额外处理）
- 232MB zip 解压的内存/性能影响

### P2 — 素材包格式细节

**P2.1 manifest.json 包含什么字段**
- 候选：name / version / createdAt / characterCount / totalSize / files[] / checksums?
- 是否需要每个文件的 SHA-256 校验和？

**P2.2 打包工具输入源 — pack.mjs 从哪里读素材**
- 候选：A) 硬编码 openCodeMM 路径 B) 命令行参数指定源目录 C) 配置文件
- 是否支持自定义素材（用户自己的角色 WebP）？

**P2.3 素材包分发方式 — zip 放在哪里供用户下载**
- 候选：A) GitHub Releases B) npm 包附带 C) 本地生成不发布
- package.json files 是否需要包含生成的 zip？

### P3 — 角色动画接入

**P3.1 角色 DOM 注入方式 — apply() 怎么注入角色**
- 当前测试要求 "injects no DOM chrome"（`document.body.querySelectorAll('[data-skin-chrome]').length === 0`），注入角色 DOM 需要改测试契约
- 角色 DOM 放在哪里？body 末尾固定浮层？某个 DSH 容器？
- 状态切换按钮要不要？（demo 有手动切换，实际 DSH 里可能自动跟随状态）

**P3.2 角色状态自动切换 — 怎么跟随 DSH 运行状态**
- 监听 DSH 的什么事件？cordis 的 ctx.sessions / ctx.workspaces？
- 状态映射：DSH 事件 -> 角色状态（idle/thinking/reading/replying/working/error/done/welcome/permission/listening）
- 过渡态怎么播放？（idle->thinking 正放 transition-idle-thinking.webp，thinking->idle 倒放 transition-thinking-idle.webp）
- 参照 openCodeMM 的 character-state.ts（会话事件 -> 角色状态 reducer）和 character-transition.ts（TRANSITIONS 表）

**P3.3 素材缺失时的降级**
- 素材未导入时：角色不显示，只保留 CSS 炫技？还是显示占位图？
- 部分素材缺失时（如有循环态但缺过渡态）：只播循环态，跳过渡？参照 openCodeMM 的 crossfade 兜底

### P4 — UI / UX 细节

**P4.1 SkinSettingsCard 改造**
- 当前检测 `/api/pet/pets`，需要改成检测素材包是否已导入
- 候选检测方式：fetch `/api/skin-jiangxiao/asset/manifest.json`，200 = 已导入，404 = 未导入
- 导入按钮的 UI 流程：选 zip -> 解压 -> 逐文件上传到 host -> 写入 ~/.dsh/ -> 显示进度
- 导入成功/失败/重复导入的反馈

**P4.2 角色动画的 UI 控制**
- 透明度调节？（openCodeMM 有 20%-100% 滑块）
- 显隐切换？
- 拖拽位置？（openCodeMM 支持拖拽）
- 这些控制放在哪里？皮肤设置卡？角色右键菜单？

### P5 — 工程 / 安全

**P5.1 测试契约变更**
- 当前 apply.spec.ts 的 "injects no DOM chrome" 测试需要改
- 新增：素材检测、角色 DOM 注入、素材服务路由、导入流程的测试

**P5.2 安全考虑 — zip 导入安全**
- 路径穿越防护（zip slip attack）：解压时校验路径不包含 `..` / 绝对路径
- 文件类型校验：只允许 .webp + manifest.json
- 文件大小限制？
- 素材包签名/校验？还是信任任意 zip？

**P5.3 dsh-skins 聚合包 — build.mjs 是否需要改**
- 当前 build.mjs 只复制 skin.json + lib/* + cordis.patch.yml
- 素材包 zip 是否需要聚合？还是只在独立包发布？

**P5.4 离线可用性**
- 素材在 ~/.dsh/ 本地，离线可用
- 但 host 端路由需要 dsh 进程运行 — 素材服务是否依赖 dsh 进程？

**P5.5 性能 — 232MB WebP 在运行时的表现**
- 按需加载（只加载当前状态 + 预加载下一状态）vs 预加载全部？
- 内存占用：每个 WebP 5-7MB，浏览器解码后 GPU 纹理内存
- 移动端/低端设备的降级策略？

### P6 — 素材路径用户自选（新增需求，2026-08-17）

**P6.1「素材路径用户自选」的确切含义**
- 关键矛盾：dsh-pet 服务链靠 registry 扫描 `~/.codex/pets/` 发现 pet，`GET /pet/<id>/<file>` 凭 id 解析到 `entry.dir`。若用户把素材放到任意自定义路径，服务链无法发现。
- 候选 A：仅在导入时选路径（默认 `~/.codex/pets/jiangxiao/`），导入后仍由 registry 管理 — 与现状一致，只是把「导入目的地」暴露给用户选。
- 候选 B：用户自选全局素材根目录（如自定义 `CODEX_HOME`），所有 pet 放其下。
- 候选 C：用户为 jiangxiao 指定一个完全独立目录，需扩展 registry/服务链支持自定义 pet 目录。

**P6.2 路径选择 UI**
- 浏览器 `<input type="file" webkitdirectory>` 只能选目录但拿不到绝对路径（浏览器安全限制）。
- 若选绝对路径，需 host 端 API 支持；浏览器无法直接拿到用户选的绝对路径。
- 候选：A) 只选 zip 文件，路径固定/可预设 B) host 端提供「目录选择」对话框（Electron 才有）C) 用户手动输入绝对路径文本。

**P6.3 与打包工具 pack.mjs 的关系**
- 打包工具输入源是否也由该自定义路径决定？