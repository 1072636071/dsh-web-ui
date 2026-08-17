# Sub-task 002 — P6 自定义 targetDir 改动面调查

**状态**: 已完成

## 调查目标

memorial 001 决策 6：jiangxiao 皮肤包复用 dsh-pet 导入链，但导入时素材存放目录允许用户自选（P6，用户确认 1+2 都要：选 zip 文件 + 选目标目录）。当前 dsh-pet 的 `POST /api/pet/import-zip` 写死 `join(codexPetsDir(), 'jiangxiao')`。调查支持自定义 targetDir 所需的改动面，以及服务链 discovery 是否受限。

这是阻塞「导入 UI 方案」grill 的关键事实问题，须先有结论才能继续。

## 调查问题

### Q1 — `POST /api/pet/import-zip` 当前协议与改动方案

- 当前路由（`packages/dsh-pet/src/routes.ts` 第 352-376 行）：raw binary body（`readRawBody` 读 zip 二进制），写死 `const targetDir = join(codexPetsDir(), 'jiangxiao')`。
- 要支持用户自定义 targetDir，有哪几种协议改动？
  - 候选 A：query string 带 `?targetDir=...`，body 仍是 raw zip 二进制（改动最小，`req.url` 解析）。
  - 候选 B：改 multipart/form-data，zip + targetDir 同包（改动大，需 multipart 解析）。
  - 候选 C：先 POST JSON 拿 upload id，再 POST 二进制（两次请求）。
- 每个候选需要改哪些文件？`readRawBody` / `requireMethod` 是否够用？需要新增 multipart 解析依赖吗？
- 安全考量：targetDir 来自用户输入，如何校验防路径穿越/越界写入？参照 `safeEntryPath`（import.ts 第 29-44 行）的校验模式。

### Q2 — 服务链 discovery 是否受限（关键）

- `assetHandler`（routes.ts 第 213-318 行）用 `registry.byId(id)` 或目录别名把 pet id 解析到 `entry.dir`，然后从 `entry.dir` 读文件。
- registry 的目录来源是什么？扫描 `codexPetsDir()`（`~/.codex/pets/`）下所有子目录（registry.ts 的 `codexPetsDir` 第 124-132 行 + 扫描逻辑）？
- 如果用户把 jiangxiao 素材导入到自定义 targetDir（如 `~/.dsh/assets/jiangxiao/`），registry 能发现吗？
  - 能 → 需要什么前提（扫描逻辑是否递归、是否限 `codexPetsDir()`）？
  - 不能 → 需要改 registry 吗？改多少？
- 服务 URL 是 `/pet/<id>/<file>`，前端凭 id 访问。若自定义目录在扫描范围外，前端 URL 还指向 `/pet/jiangxiao/...`，但 404 了。确认这一点。

### Q3 — registry 扫描机制的细节

- registry 在什么时候构建？（启动时快照？`service.registrySnapshot()`？）
- 若导入发生在运行时，registry 是否需要刷新？现有导入后有没有触发 registry 重建的机制？
- 自定义目录是否要求必须位于 `codexPetsDir()` 之下，否则改动面失控？

### Q4 — 前端拿绝对路径的可行性

- 浏览器 `<input type="file">` 拿不到绝对路径（安全限制）。
- 若用户想选自定义目标目录，前端只能用：A) 文本输入绝对路径 B) host 端目录选择对话框（需 Electron/桌面能力，本项目是 web GUI，可能没有）。
- 本项目是纯 web GUI（dsh web），是否有 host 端目录选择能力？查 dsh-web 的 host 端是否暴露过文件/目录对话框。

### Q5 — 推荐的实现方案

- 综合 Q1-Q4，给出推荐方案：改哪些文件、dsh-pet 改动面多大、jiangxiao 皮肤包侧改动面多大。
- 是否值得做，还是应回退到「只选 zip 文件，目标目录固定/默认」？

## 输出要求

把调查结果写回本工单「调查结果」段，每个问题给出：
- 事实（代码路径 + 关键代码片段 + 链接）
- 结论（可行/不可行/需要改 X）
- 对实现方案的影响

不要写代码，只调查。完成后把状态改为「已完成」。
