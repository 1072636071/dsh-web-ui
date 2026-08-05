# @deepseek-ai/dsh-live-stats

[English](README.md) | 中文

DSH Web 的实时输入/输出 token 估算与生成吞吐显示。它保留内置的会话状态行，在响应流式输出时实时更新输入/输出 token 总量，并额外增加一行生成吞吐：

```text
Input ~7.9K tok · Output ~12 tok
TPS 31.4 tok/s
```

`~` 表示启发式估算。当 provider 用量到达时，估算值会被真实用量替换；精确的缓存统计始终来自 DSH 的持久化 token 用量投影。重试会替换该步骤先前的估算，被中止的回合会移除其未结算的估算。

## 功能

- **宿主侧**：注册可重放的 `liveTokenUsage` 会话投影（`ctx.sessionProjections`）。该折叠从表面日志加上 header/工具框架估算输入 token，从流式 chunk 估算输出 token，并在 `usage` chunk 或最终消息落地后立即用 provider 用量替换估算。TPS 由活跃步骤的输出 token 除以墙钟耗时得出。
- **客户端**：`conversation.composer.dock` 槽位条目（`live-tps`）在内置会话统计行下方渲染第二行状态；响应流式输出期间持续更新，回合结束后保留最近一次已结算步骤的 TPS 直到下一回合。

## 安装

仓库内包：加入个人 DSH overlay（`~/.dsh/config.yaml`），保存即热加载：

```yaml
- insert:
    - id: live-stats
      name: '@deepseek-ai/dsh-live-stats'
      config:
        charsPerToken: 4
        blockOverhead: 4
        roleOverhead: 4
```

三个估算参数均可选（默认值如上）。

## 配置

| 键 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `charsPerToken` | `number` | `4` | 一个 token 大致对应的文本字符数 |
| `blockOverhead` | `number` | `4` | 每个内容块分配的固定框架 token 数 |
| `roleOverhead` | `number` | `4` | 每条消息或助手响应分配的固定框架 token 数 |

## 导出形态

函数/命名空间插件：`inject` / `Config` / `apply`，无默认导出。估算器（`./estimator`）与投影折叠（`./projection`）均为纯函数并有单元测试；客户端 `TpsLine` 通过运行时投影 hook 渲染。invariant 伴侣注册于 `./invariant`。

## 模型体验

### 提示与工具面

#### 模型看到什么

什么也看不到。插件不注入提示段落、不注册工具、也不自行发出 `session` 事件——它只消费持久化事件流与投影载体的线路径。

#### Token 影响

每个请求为零。

#### KV 缓存影响

无系统提示贡献，因此对缓存稳定性无影响。

## 已知限制与待办

- **启发式估算**：在 provider 用量到达前，输入/输出总量为字符数启发式（`~`）；精确缓存统计始终来自 DSH 的持久化 token 用量投影。
- **仅 Web**：TPS 行渲染在 DSH Web 的 composer dock；暂无 TUI 等价物。
- **单一活跃步骤**：投影每个会话只跟踪一个活跃步骤，dock 行显示该会话的视图；并发会话各自拥有独立投影。
- **密度假设**：`charsPerToken` 默认为 4 字符，会低估中文文本、高估纯 ASCII；若估算偏差明显，请按部署调整。
