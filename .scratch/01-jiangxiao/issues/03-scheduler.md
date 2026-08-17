# 过渡调度器（纯函数）

**Status:** ready-for-agent

**Blocked by:** 02

**构建内容：** webp 宠物动画切换的核心纯函数：给定 `(当前动画, 目标动画, 过渡表)`，按枢纽制查表输出播放序列 `(过渡文件序列, 终态循环文件)`，支持直达 1 段 / 经 idle 中转 2 段 / 无素材 crossfade 兜底，并为快速连续切换提供"播放 key 作废"判定。无 DOM、时钟注入、完全可单测。

**验收标准：**

- [ ] 纯函数 `resolveTransition(from, to, transitions)` → `{ segments: TransitionSegment[], final: JiangxiaoState, key: string }`
- [ ] 枢纽制：直达边返回 1 段；无直达边经 idle 中转返回 2 段（`from→idle` 倒放 + `idle→to` 正放）；均无素材返回空序列（触发 crossfade 兜底信号）
- [ ] pet→姜晓映射接入：`idle/running→thinking/running-right→working/review→replying/waiting→listening/jumping→done/failed→error/running-left→idle/waving→welcome`（D8）
- [ ] 仅索引 pet 可达 10 态路径；微表情态/不可达态（cheek-rest/chin-rest/nod-smile/shush/shy-smile/frown-wave/permission/reading）不进过渡表（D13）
- [ ] key 作废：新目标到达时旧过渡判定为作废（用于渲染层打断），纯函数可断言
- [ ] 单测全绿：直达/中转/兜底/作废/映射表全覆盖（新文件，无 DOM，纯 vitest）

**参考（来自 PRD S1 seam，勿偏离）：**

```
输入: (当前动画, 目标动画, 过渡表)
输出: (过渡文件序列, 终态循环文件)   // 含作废 key
```

## 评论

（评论与对话历史追加于此，新内容置于最前。）
