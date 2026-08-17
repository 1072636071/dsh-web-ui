# Sub-task 001 — P1 技术前提调查

**状态**: 已完成

## 调查目标

为 jiangxiao 皮肤包素材导入功能调查 host 端文件写入/服务能力。这是 memorial 001 的 P1 阻塞前提，必须先有事实才能继续 grill。

## 调查问题

### Q1 — dsh/cordis 是否有现成的文件写入/上传 API/服务？

- 查 `node_modules/@deepseek-ai/*` SDK 类型声明，找 fs / file / upload / write 相关服务接口
- 查 cordis 是否暴露文件系统服务（ctx.fs? ctx.file?）
- 查 dsh host 端是否有通用的「写文件到用户目录」HTTP 路由

### Q2 — 皮肤包 host 半区能否注册 HTTP 路由？

- 查 `packages/skins/jiangxiao/src/index.ts` 当前 apply() 签名，host 半区能拿到什么 ctx
- 查其他皮肤包 / 插件包的 host 半区是否注册过 HTTP 路由
- 查 cordis bundle 的 host 半区 API：能否注册路由？能否挂载静态文件服务？

### Q3 — 其他插件如何持久化数据到磁盘？

- 重点查 `packages/dsh-pet/`（pet 也是用户级数据，可能有 fs 持久化）
- 查 `packages/dsh-task-board/`、`packages/dsh-ssh/` 是否有写文件到 ~/.dsh/ 的先例
- 它们用的是 cordis 服务、自己注册路由、还是别的机制？
- 数据写到哪个目录？怎么拿到路径？

### Q4 — skin-center 路由能否扩展？皮肤包能否自己注册路由？

- 查 `packages/skins/skin-center/` 的 routes.ts（或等价文件），看路由注册机制
- skin-center 是否只服务 lib/client.js，能否加自定义路由？
- 皮肤包自己注册路由的机制（如果存在）：在 host 半区 apply() 里怎么写？

### Q5 — 素材服务路由候选

- 候选 A: 皮肤包 host 半区注册 `/api/skin-jiangxiao/asset/<filename>` 路由，服务 `~/.dsh/assets/jiangxiao/`
- 候选 B: 复用 skin-center 某路由
- 候选 C: 复用 dsh 已有的静态文件服务
- 哪个可行？需要改哪些文件？

## 输出要求

把调查结果写回本工单的「调查结果」段，每个问题给出：
- 事实（代码路径 + 关键代码片段 + 链接）
- 结论（可行/不可行/需要改 X）
- 对候选方案的影响

不要写代码，只调查。完成后把状态改为「已完成」。

## 调查结果

### Q1 — dsh/cordis 是否有现成的文件写入/上传 API/服务？

**事实**：

cordis 本身不暴露通用 fs 服务（`Context` 接口只有 events / logger / reflect / registry，见 `node_modules/.pnpm/@deepseek-ai+cordis@4.0.1.../lib/types/context.d.ts`）。但 host 半区运行在 Node.js 进程，可直接 `import { mkdirSync, writeFileSync, renameSync } from 'node:fs'`。

dsh-host-webserver 提供 HTTP 路由注册服务，路由处理器拿到原生 `IncomingMessage` / `ServerResponse`，可读 raw binary body。SDK 类型声明（`node_modules/.pnpm/@deepseek-ai+dsh-host-webse.../lib/types/index.d.ts`）：

```ts
export interface WebRoute {
  kind: WebRouteKind;            // 'exact' | 'prefix'
  path: string;                  // 绝对路径，无尾斜杠
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
}
export declare class WebServer extends Service {
  register(route: WebRoute): () => void;
  registerUpgrade(route: WebUpgradeRoute): () => void;
  registerFallback(handler: WebRoute['handler']): () => void;
  tapIndex(transform: (html: string) => string): () => void;
  get port(): number;
  get host(): Config['host'];
}
```

dsh-pet 已实现 250MB raw binary body 读取（`packages/dsh-pet/src/routes.ts` 第 139-158 行）：

```ts
function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let size = 0
    const MAX = 250 * 1024 * 1024
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX) { reject(new Error('body-too-large')); queueMicrotask(() => req.destroy()); return }
      chunks.push(chunk)
    })
    req.on('end', () => { resolve(Buffer.concat(chunks)) })
    req.on('error', reject)
  })
}
```

**结论**：可行。cordis 不提供高层 fs 服务，但 host 半区是 Node 进程，直接用 `node:fs` + `node:path` + `node:os` 写文件；HTTP 路由经 `ctx.webServer.register` 注册，处理器读 raw body 即可接收二进制上传。没有现成的「写文件到用户目录」通用路由，但 dsh-pet 的 `/api/pet/import-zip` 是完整先例。

**对候选方案的影响**：P1.1 候选 A（皮肤包 host 半区注册上传路由）可行；候选 C（cordis 服务暴露 fs 能力）不存在，cordis 不暴露 fs 服务。

---

### Q2 — 皮肤包 host 半区能否注册 HTTP 路由？

**事实**：

jiangxiao 当前 host 半区是空的（`packages/skins/jiangxiao/src/index.ts`）：

```ts
/** Host loader entry for the browser-only skin plugin. */
/** Provides no host-side behavior. */
export function apply(): void {}
```

skin-center 是皮肤包，它的 host 半区（`packages/skins/skin-center/src/index.ts`）注册了完整路由家族：

```ts
import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'   // 拉入 ctx.webServer 类型
import { makeSkinCenterRoutes, SKIN_CENTER_API_PREFIX } from './routes.ts'
import { mountOnce } from './mount-once.ts'

export const name = 'ui-skin-center'
export const inject = ['webServer']                      // 声明依赖 webServer 服务

export const apply = mountOnce('@linxin666/dsh-client-ui-skin-center', applyImpl)

function applyImpl(ctx: Context): void {
  const routes = makeSkinCenterRoutes()
  try {
    ctx.effect(() => {
      const disposers: Array<() => void> = []
      for (const route of routes) disposers.push(ctx.webServer.register(route))
      return () => { for (const dispose of disposers) dispose() }
    }, 'ui-skin-center: routes')
  } catch (error) { console.error('[ui-skin-center] route registration failed:', error) }
}
```

`WebRoute` 类型来自 `@deepseek-ai/dsh-host-webserver`（见 Q1）。`mountOnce` 是 `shared/host/mount-once.ts` 的同步副本，防双挂载。

**结论**：可行。皮肤包 host 半区能注册 HTTP 路由，模式与插件包完全相同。jiangxiao 当前 `apply(): void {}` 是空实现，需改造为 `apply = mountOnce('@linxin666/dsh-client-ui-skin-jiangxiao', applyImpl)` + `applyImpl(ctx: Context): void` + `export const inject = ['webServer']`。

**对候选方案的影响**：P1.1 候选 A 可行；P1.2 素材服务路由可由 jiangxiao 自己注册，无需复用其他包。

---

### Q3 — 其他插件如何持久化数据到磁盘？

**事实**：

**dsh-pet 是完整先例**（`packages/dsh-pet/src/`）：

1. `dsh-home.ts`（`shared/host/dsh-home.ts` 的同步副本）解析 DSH 主目录：

```ts
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
export function resolveDshHome(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const raw = env.DSH_HOME
  if (raw !== undefined && raw.trim() !== '') {
    const expanded = expandHome(raw.trim(), home)
    return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded)
  }
  return join(home, '.dsh')
}
export function dshHome(): string { return resolveDshHome() }
```

2. `persist.ts` 原子写 `~/.dsh/pet.json`：

```ts
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { dshHome } from './dsh-home.ts'
export function petHomeDir(): string { return dshHome() }
export function savePetPersist(data: PetPersist, dir: string = petHomeDir()): void {
  mkdirSync(dir, { recursive: true })
  const target = join(dir, 'pet.json')
  const tmp = `${target}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
  renameSync(tmp, target)              // 原子重命名
}
```

3. `registry.ts` 第 124-132 行解析素材目录（注意是 `~/.codex/pets`，不是 `~/.dsh`）：

```ts
export function codexPetsDir(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const raw = env.CODEX_HOME !== undefined && env.CODEX_HOME.trim() !== ''
    ? env.CODEX_HOME.trim() : join(home, '.codex')
  const expanded = raw === '~' ? home
    : (raw.startsWith('~/') || raw.startsWith('~\\')) ? join(home, raw.slice(2)) : raw
  return join(expanded, 'pets')
}
```

4. `import.ts` 用 fflate 解压 zip + 校验 zip slip + 写文件（第 123-225 行）：

```ts
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { unzipSync, type Unzipped } from 'fflate'
const MAX_FILE_SIZE = 500 * 1024 * 1024
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024
function safeEntryPath(raw: string): string | undefined {
  const normalized = raw.replace(/\\/g, '/')
  if (normalized.startsWith('/')) return undefined
  if (/^[A-Za-z]:\//i.test(normalized)) return undefined
  if (normalized === '' || normalized.endsWith('/')) return undefined
  const segments = normalized.split('/').filter(s => s !== '')
  for (const segment of segments) { if (segment === '..' || segment === '.') return undefined }
  return segments.join(sep)
}
export function importPetZip(zipBuffer: Buffer, targetDir: string): ImportResult { /* ... */ }
```

5. `routes.ts` 第 355-376 行注册 zip 导入路由：

```ts
{
  kind: 'exact',
  path: PET_API_PREFIX + '/import-zip',
  handler: (req, res) => {
    if (!requireMethod(req, res, 'POST')) return Promise.resolve()
    return readRawBody(req).then((body) => {
      const targetDir = join(codexPetsDir(), 'jiangxiao')
      const result = importPetZip(body, targetDir)
      if (!result.ok) { json(res, 400, { ok: false, error: resolveImportError(req, result.errorCode, result.errorData) }); return }
      json(res, 200, result)
    }, ...)
  }
} as WebRoute,
```

**dsh-ssh**（`packages/dsh-ssh/src/index.ts` 第 127-137 行）同样用 `ctx.webServer.register` + `ctx.webServer.registerUpgrade`，主机配置存 `~/.dsh/dsh-ssh.json`（0700 目录、0600 文件、原子写入，见 `packages/dsh-ssh/AGENTS.md` 安全模型）。

**dsh-task-board**（`packages/dsh-task-board/src/index.ts`）数据存浏览器 localStorage（键 `dsh.taskBoard.v1`），`inject = ['systemPrompt']`，无 host 端持久化。

**dsh-git-graph / dsh-aionui-panel / dsh-remote-web-ui** 都用 `ctx.webServer.register` 注册路由（grep 共 18 处命中），模式一致。

**结论**：可行。先例充分：host 半区是 Node 进程，直接用 `node:fs` 写文件；路径用 `dshHome()`（`~/.dsh`）或自定义解析函数（如 `codexPetsDir()` → `~/.codex/pets`）；原子写用 `writeFileSync` tmp + `renameSync`；zip 解压用 fflate；路由用 `ctx.webServer.register`。jiangxiao 可直接复用 `shared/host/dsh-home.ts` 的 `dshHome()` 写到 `~/.dsh/assets/jiangxiao/`。

**对候选方案的影响**：P1.1 候选 A 完全可行，dsh-pet 的 `import.ts` + `routes.ts` 是可直接照搬的模板；P1.3 zip 解压候选 A（fflate）已被 dsh-pet 采用，仓库已有依赖。

---

### Q4 — skin-center 路由能否扩展？皮肤包能否自己注册路由？

**事实**：

skin-center 的 `routes.ts`（`packages/skins/skin-center/src/routes.ts`）是模块函数 `makeSkinCenterRoutes(deps?): WebRoute[]`，由 host 半区 `applyImpl` 注册。当前路由家族（第 254-302 行）：

```ts
export const SKIN_CENTER_API_PREFIX = '/api/skin-center'
export function makeSkinCenterRoutes(deps: SkinCenterRoutesDeps = {}): WebRoute[] {
  return [
    getRoute(`${SKIN_CENTER_API_PREFIX}/state`, ...),    // GET 当前皮肤
    bundleRoute(),                                         // GET /api/skin-center/bundle/<id> 服务 lib/client.js
    postRoute(`${SKIN_CENTER_API_PREFIX}/apply`, ...),    // POST 切换皮肤
  ]
}
```

`bundleRoute`（第 208-248 行）只服务 `packages/skins/<id>/lib/client.js`（皮肤包预构建 bundle），用 `kind: 'prefix'` 匹配 `/api/skin-center/bundle/<id>`，id 经 `/^[a-z0-9-]+$/` 校验后查 `skinDirectories()` map（id -> 绝对目录），`readFileSync(bundle, 'utf8')` 返回。**不服务任意用户目录文件**。

皮肤包自己注册路由的机制与 skin-center 完全相同：在 host 半区 `apply(ctx: Context)` 里 `ctx.webServer.register(route)`。`mountOnce` 防双挂载，`inject = ['webServer']` 声明依赖，`ctx.effect(() => { ... return disposer }, 'label')` 绑定生命周期。

**结论**：skin-center 路由是模块内函数，可扩展但跨包耦合不合适；皮肤包自己注册路由的机制成熟（skin-center 本身就是皮肤包先例）。jiangxiao 应自己注册路由，不改 skin-center。

**对候选方案的影响**：P1.2 候选 A（皮肤包自己注册 `/api/skin-jiangxiao/asset/<filename>`）可行且推荐；候选 B（复用 skin-center 某路由）不可行，skin-center 只服务 lib/client.js，扩展要改 skin-center 包跨包耦合。

---

### Q5 — 素材服务路由候选

**事实**：

- **候选 A（皮肤包 host 半区注册 `/api/skin-jiangxiao/asset/<filename>`）**：**可行**。改造点：
  1. `packages/skins/jiangxiao/src/index.ts` 改为 skin-center 模式：`apply = mountOnce('@linxin666/dsh-client-ui-skin-jiangxiao', applyImpl)` + `applyImpl(ctx: Context): void` + `export const inject = ['webServer']`
  2. 新增 `packages/skins/jiangxiao/src/routes.ts`：注册 `kind: 'prefix'` 路由 `/api/skin-jiangxiao/asset`，handler 服务 `~/.dsh/assets/jiangxiao/` 下文件（参照 dsh-pet `assetHandler` 第 213-318 行的白名单 + MIME 映射模式）
  3. 新增 zip 导入路由 `/api/skin-jiangxiao/import-zip` POST（参照 dsh-pet `routes.ts` 第 355-376 行）
  4. `cordis.patch.yml` 无需改（已挂载 ui-skin-jiangxiao）
  5. `package.json` 需加 `fflate` 依赖（zip 解压）+ `@deepseek-ai/dsh-host-webserver` peerDependency

- **候选 B（复用 skin-center 某路由）**：**不可行/不合适**。skin-center 的 `bundleRoute` 只服务 `lib/client.js`（皮肤包预构建 bundle），用 `skinDirectories()` map 查找皮肤目录，不服务任意用户目录文件。扩展 skin-center 要改 skin-center 包，跨包耦合，且 skin-center 不认识 `~/.dsh/assets/jiangxiao/`。

- **候选 C（复用 dsh 已有静态文件服务）**：**未找到证据**。dsh-host-webserver 只有 `registerFallback`（SPA dist 服务，由前端插件拥有，第二注册会抛错）、`register` / `registerUpgrade` / `tapIndex`，没有通用的「服务任意目录」路由。dsh-pet 的 `/pet/<id>/*` 是自己 `ctx.webServer.register` 注册的 prefix 路由，不是复用 dsh 内置。grep `ctx.webServer` 全仓 18 处命中，全部是各包自己注册路由，无一处复用「dsh 静态文件服务」。

**额外发现**：dsh-pet 已实现 jiangxiao 角色素材的完整导入 + 服务链：
- 导入：`POST /api/pet/import-zip`（raw binary body，250MB 上限）→ `importPetZip()` → 写到 `~/.codex/pets/jiangxiao/`
- 服务：`GET /pet/jiangxiao/<file>`（prefix 路由，白名单 petAssetFiles + MIME 映射）
- 校验：pet.json manifest `kind: "animated-webp"` + 10 个 states + transitions

jiangxiao 皮肤包当前 `SkinSettingsCard.tsx`（第 27-36 行）就是 `fetch('/api/pet/pets')` 检测 jiangxiao pet 是否注册，引导用户去 pet 设置卡导入：

```ts
async function hasJiangxiaoPet(): Promise<boolean> {
  try {
    const response = await fetch('/api/pet/pets')
    if (!response.ok) return false
    const list: PetChoice[] = await response.json()
    return list.some(pet => pet.id === 'jiangxiao')
  } catch { return false }
}
```

**结论**：候选 A 可行且推荐；候选 B 不可行；候选 C 无证据。dsh-pet 已有完整 jiangxiao 素材导入 + 服务链，写到 `~/.codex/pets/jiangxiao/`，jiangxiao 皮肤包当前依赖它。

**对候选方案的影响**：
- 若 memorial 001 决策素材存 `~/.dsh/assets/jiangxiao/`（用户级、跨项目共享、不依赖 codex 概念），用候选 A，jiangxiao 皮肤包自己注册路由，dsh-pet 的 `import.ts` / `routes.ts` / `persist.ts` 是可直接照搬的模板。
- 若接受素材存 `~/.codex/pets/jiangxiao/`（复用 dsh-pet 已有链），jiangxiao 皮肤包无需新增 host 半区，只需在 client 半区引用 `/pet/jiangxiao/<file>` — 但这与 CONTEXT.md 已决策的 `~/.dsh/assets/jiangxiao/` 冲突。
- P1.2 素材服务路由定为 `/api/skin-jiangxiao/asset/<filename>`（prefix，kind: 'prefix'），与 dsh-pet 的 `/pet/<id>/*` 模式一致。