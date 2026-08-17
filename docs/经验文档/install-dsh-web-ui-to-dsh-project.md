# 把 dsh-web-ui 全家桶安装到 DSH 项目

适用场景：在一个 DeepSeek Harness（dsh）项目 checkout 里（例如
`E:\work\sp\deepseek-harness`）开发或调试 DSH 本体时，同步挂载本地
dsh-web-ui 全家桶插件，让 Web UI 侧的功能插件（task-board / git-graph /
ssh / pet / remote-web-ui / live-stats / web-ui-settings / skin-center /
community-plugins）+ 皮肤全家桶（dsh-skins）一起生效。源码改动重 build 即
热更新，无需重装。

仓库侧的「新插件入桶」流程见 [plugins.md](../plugins.md)；本文是消费侧
（用户把已构建的全家桶装到某个 DSH 项目）的操作经验。

## 关键认知

- **profile 是全局的**：DSH profile 不在 DSH 项目目录里，而在
  `~/.dsh/profiles/<name>/`（Windows: `C:\Users\<user>\.dsh\profiles\web\`）。
  在任何 DSH 项目里跑 `dsh web` 都加载同一个 web profile。所以「装到
  deepseek-harness 项目」与「装到任意 dsh 项目」是同一回事——都是装到
  全局 web profile。
- **`@linxin666` scope 不可改**：dsh-web-ui 仓库作者选定的 npm scope，
  根 AGENTS.md 写死。这是发布层标识，loader 通过 cordis.patch.yml 的
  `name:` 字段做 Node 包解析查找；想换 scope 需要改全部
  `packages/*/package.json`、所有 `cordis.patch.yml`、
  `scripts/link-profile.mjs` 第 57 行的 `FAMILY_SCOPE`，且要重新发包。
  本地 link 不动这个。
- **`dsh` 命令通常不在 PATH**：DSH 项目 checkout 不会全局安装 dsh。
  在 DSH 项目目录下用 `pnpm dsh <args>` 调用（package.json scripts.dsh
  指向 `apps/cli/src/bin.ts`）。前提是该 DSH 项目已 `pnpm install`。
- **共享 link 层**：`scripts/link-profile.mjs` 把全部家族包 link 到
  `~/.dsh/profiles/node_modules/@linxin666/`（顶层共享层，所有 profile
  共用），不是某个 profile 的私有 node_modules。聚合包的 `workspace:*`
  依赖靠这一层解析。

## 前置条件

- dsh-web-ui 仓库已构建：每个 `packages/*/lib/index.js` 就位（dsh-skins
  例外，它的入口是 `skins/<id>/lib/index.js`，顶层无 lib）。构建命令
  `pnpm -r build`（在 dsh-web-ui 仓库根）。
- 目标 DSH 项目已 `pnpm install`（验证 `node_modules/@deepseek-ai/` 下
  有 dsh-app-boot 等包即可）。

## 安装步骤

### 1. link 全家族包到共享层

在 dsh-web-ui 仓库根执行：

```sh
node scripts/link-profile.mjs            # 链接/刷新全家桶
node scripts/link-profile.mjs --dry-run   # 预览
```

Windows 下脚本自动用 junction（不用 symlink，避开 EPERM）。幂等可重跑：
已存在的正确 link 跳过，stale link 替换。

验证 link 完整性（27 个包都应就位）：

```sh
# 检查共享层 @linxin666/ 下条目数与 package.json + lib/index.js 是否齐
ls ~/.dsh/profiles/node_modules/@linxin666/ | wc -l
```

注意：`dsh-skins` 的入口在 `skins/<id>/lib/`，顶层无 `lib/index.js`，
不要误判为坏 link。

### 2. 把聚合包注册进 web profile

在 DSH 项目目录下执行（不是 dsh-web-ui 仓库）：

```sh
pnpm dsh plugin --profile web add link:<dsh-web-ui 绝对路径>/packages/dsh-web-ui-all
```

举例（Windows 正斜杠也行）：

```sh
pnpm dsh plugin --profile web add link:E:/work/sp/dsh-web-ui/packages/dsh-web-ui-all
```

成功后 web profile 的 `package.json` 会同时更新：

- `dependencies` 里加 `"@linxin666/dsh-web-ui-all": "link:..."`；
- `dsh.profile.bundles` 数组追加 `"@linxin666/dsh-web-ui-all"`。

reconcilePlugins（`apps/cli/src/plugin.ts`）按「依赖解析到一个声明了
`dsh.bundle` 的包」自动入栈，不用手改 bundle 列表。

### 3. 验证挂载

```sh
pnpm dsh --profile web --dump-config
```

输出末尾应出现 `# == @linxin666/dsh-web-ui-all` 段，含 13 行 `web-ui-*`
子插件：

```
- id: web-ui-compat
  name: '@linxin666/dsh-web-ui-all'
- id: web-ui-settings
  name: '@linxin666/dsh-client-ui-web-ui-settings'
- id: web-ui-task-board
  name: '@linxin666/dsh-client-ui-task-board'
... (共 13 行)
```

聚合行 id 命名空间是 `web-ui-*`（剥掉子包 `ui-` 前缀），与独立包安装
共存，不触发 loader 的 duplicate entry id。

### 4. 启动

```sh
pnpm dsh web
```

默认监听 `http://127.0.0.1:3080`。

## 后续迭代

dsh-web-ui 源码改动后，在 dsh-web-ui 仓库根跑：

```sh
pnpm -r build
```

link 已就位，无需重装。重启 `dsh web` 即生效。

新增/删除包时再跑一次 `node scripts/link-profile.mjs` 同步共享层。

## 已知遗留（非本次操作造成）

`~/.dsh/cordis.patch.yml` 可能有历史遗留的 `dsh-skin managed` 区段（注释
明说 auto-generated），形如：

```yaml
# --- dsh-skin managed (auto-generated; do not edit) ---
- id: ui-skin-dragon-heir
  disabled: true
... (旧版 ui-skin-* id，与聚合包 web-ui-* 命名空间不匹配)
```

每次启动会刷 `entry "ui-skin-xxx" not found` 警告。无害，是旧版 `dsh-skin`
工具留下的禁用记录。不要手改——应由新版 `dsh-skin` 工具在 web 启动后
重做皮肤启用配置覆盖。

## 踩坑记录

### `dsh: command not found`

DSH 项目 checkout 不会全局安装 dsh。用 `pnpm dsh` 而非 `dsh`。前提是 DSH
项目已 `pnpm install`。

### link 目录看起来是空的

`LS` 工具对 Windows junction 渲染有时显示为空目录，但文件实际可访问。
用 `Glob` 列具体文件路径（如 `*/lib/index.js`）能正常返回，或用
`fs.readdirSync` + `fs.readlinkSync` 在 Node 里验证。

### dsh-skins 看起来是「坏 link」

dsh-skins 是皮肤聚合载具，设计上无顶层 `lib/index.js`，入口在
`skins/<id>/lib/index.js`。验证脚本若以「顶层 lib/index.js 存在」判好坏
会误报。dsh-skins 的 package.json + cordis.patch.yml 在即可。

### profile 不是 pnpm workspace

profile 目录有自己的 `package.json` + `pnpm-workspace.yaml`，但聚合包
package.json 里的 `workspace:*` 依赖在 profile 里无法就地解析，会回退
拉取 npm 已发布版本。所以共享层 link（步骤 1）是必须的——它让全部子包
走本地代码，而不是 npm 上可能滞后的版本。如果跳过步骤 1 直接做步骤 2，
会出现「宿主已挂载但 UI 不显示」（npm 版本缺 chunk 或子包滞后）。

## 相关文档

- [plugins.md](../plugins.md)：仓库侧「新插件入桶」流程（开发者视角）
- [development.md](../development.md)：dsh-web-ui 日常开发循环
- DSH 项目侧的 `apps/cli/src/plugin.ts` / `apps/cli/src/profile-boot.ts`：
  `dsh plugin` 子命令与 profile 启动逻辑的事实源
