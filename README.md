# dsh-pet — 鲸鱼娘宠物插件

DSH Web GUI 的宠物插件：一只软萌治愈的**鲸鱼娘**陪伴你在 DeepSeek Harness 里工作。她会根据模型的工作状态切换动画（思考、干活、等你输入、庆祝完成），可以摸头、喂食，亲密度会慢慢成长。

参考 Codex 桌面版宠物功能复刻，采用 DSH 官方插件形态（cordis bundle：host 半区 + client 半区单包）。

## 功能

| 功能 | 说明 |
|---|---|
| 状态动画 | 模型状态 → 鲸鱼娘动画：`thinking/tool → 工作`、`waiting → 等待`、`done → 跳跃庆祝`、空闲 → `idle` 呼吸待机 |
| 摸头互动 | 点击鲸鱼娘 → 气泡反馈 + 亲密度 +1（10s 冷却） |
| 喂食 | 悬浮面板「喂食」→ 消耗 1 条小鱼干 + 亲密度 +5（30s 冷却） |
| 饲料经济 | 小鱼干库存（上限 20）：**工作产出**每 3 个回合 +1 条 + **时间产出**每 30 分钟 +1 条；库存不足提示"多陪鲸鱼娘工作一会儿" |
| 亲密度 | 每次完成回合 +1；4 个等级：幼鲸 🐣 → 伙伴 🐬 → 挚友 🐳 → 深海羁绊 💙（100 点封顶） |
| 自定义命名 | hover 面板「改名」→ 1-20 字符，持久化，召唤按钮/面板同步显示 |
| 拖动 | 按住鲸鱼娘拖动可重新摆放（位置持久化） |
| 隐藏/召唤 | 悬浮面板「隐藏」；隐藏后 composer dock 出现「召唤{名字}」按钮 |
| 状态气泡 | 工作时显示模型当前状态短语 |

## 素材

鲸鱼娘素材由 [hatch-pet](https://github.com/dsh2026) 流水线制作：`assets/whale/spritesheet.webp`（1536×1872 图集，8 列 × 9 行 192×208 单元，9 个动画状态）+ `assets/whale/pet.json`。

## 架构

```
dsh-pet/
├── src/
│   ├── index.ts        # host 半区：插件入口（cordis apply，注册路由）
│   ├── service.ts      # PetService：宠物状态机 + 亲密度 + 配置（HTTP API 服务面）
│   ├── state.ts        # 宠物状态机：activity/status phase → 9 状态动画
│   ├── affinity.ts     # 亲密度账本（纯函数 + 冷却）
│   ├── persist.ts      # 持久化（$DSH_HOME/pet.json，原子写入）
│   ├── routes.ts       # /api/pet/* JSON API + /pet/whale/* 素材静态路由
│   └── client/         # 浏览器半区
│       ├── index.ts    # slots 注册 + 轮询（800ms）+ 交互接线（fetch）
│       ├── PetDockEntry.tsx  # conversation.composer.dock 挂载点
│       ├── WhalePet.tsx      # 浮层组件（portal + rAF 帧动画 + 拖动）
│       ├── spritesheet.ts    # 图集几何 + 每状态动画轨道（帧/时长）
│       └── pet.module.css
├── assets/whale/       # 鲸鱼娘素材（pet.json + spritesheet.webp）
└── cordis.patch.yml    # bundle patch：插入 pet 插件行
```

### 数据流

```
working-activity 插件 ── activity/status session 事件 ──▶ PetService（host）
                                                              │ /api/pet/* JSON
conversation.composer.dock 槽位 ◀── 轮询 800ms ── pet-client（浏览器）
                                                              │
                                                   WhalePet 浮层（portal + rAF）
```

- 状态源：`working-activity` 插件发布的 `activity/status` 会话事件（phase: idle/waiting/thinking/tool/done + 状态短语），由 host 半区监听。
- 挂载点：`conversation.composer.dock`（list 槽位，与 live-stats 同区），组件内部 `createPortal` 渲染全局浮层。
- 渲染：CSS sprite（background-position）逐帧动画，帧时长来自 `spritesheet.ts` 的轨道定义。
- 通信：浏览器 ↔ host 走同源 `/api/pet/*` JSON 端点（state/interact/set-visible/set-config），图集从 `/pet/whale/spritesheet.webp` 加载——RPC 域与 `/plugins/` 静态服务都是平台注册的，插件自足地提供自己的 API 与素材（与 dsh-remote-web-ui 的 `/api/pair` 同一模式）。

## 安装

```sh
# 1. 构建插件
cd /Users/zcl/code/dsh-pet && pnpm install && pnpm build

# 2. 安装到 web profile（link 模式，改代码后 pnpm build 即生效）
cd ~/.dsh/profiles/web
pnpm add @deepseek-ai/dsh-pet@link:/Users/zcl/code/dsh-pet

# 3. 在 package.json 的 dsh.profile.bundles 中加入 "@deepseek-ai/dsh-pet"
#    （bundle 的 cordis.patch.yml 会自动插入插件行）

# 4. 重启 dsh web
```

## 开发

```sh
pnpm build        # tsc -b（类型+声明）&& tsdown（node 半区 + 浏览器 bundle）
pnpm prepare      # 仅转译构建（无类型检查，供消费者安装）
pnpm typecheck    # 仅类型检查
```

浏览器 bundle 走 `window.__ModuleLoader__.load` 契约，React/cordis 等由 loader 模块表解析（external）；CSS Modules 由 lightningcss 内联为 `<style data-plugin>`。

## 动画轨道校准

鲸鱼娘图集由 hatch-pet 流水线按 9 状态 × 8 列生成；每行实际帧数与节奏在 `src/client/spritesheet.ts` 的 `TRACKS` 中定义。若素材重做导致帧数变化，只需更新该表（行序契约：0 idle / 1 running-right / 2 running-left / 3 waving / 4 jumping / 5 failed / 6 waiting / 7 running / 8 review）。
