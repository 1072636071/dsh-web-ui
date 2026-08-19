# 浮层状态机移植（纯函数）

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** 移植 openCodeMM 的角色状态编排三件套为皮肤包内纯函数模块：reduceCharacter（10 态 reducer + 13 种归一化事件 + 优先级表 + preWorking/prePermission 回退 + 时序常量）、TRANSITIONS 枢纽表（按 jiangxiao 实有 36 段过渡 webp 填表）、getTransitionPath（直达/经 idle 枢纽两段/缺段空序列）。用户视角：无直接可见变化——这是浮层行为正确性的地基，保证状态切换合乎优先级且过渡段可解析。

**验收标准：**

- [x] 三件套为纯函数模块：无 DOM、无定时器、无副作用，可脱离浏览器单测
- [x] 状态联合 = 设计 10 态逐字一致（idle/thinking/reading/replying/working/error/welcome/done/permission/listening）；listening 保留类型但运行时不触发
- [x] 优先级表：error 5 > working 4 > permission 3 > thinking/replying/done/reading 2 > welcome/idle 1；高优先级不被低优先级打断
- [x] 时序常量：reading 阈值 8000ms、done 驻留 3000-5000ms、welcome 驻留 3000ms
- [x] TRANSITIONS 表覆盖实有过渡素材（idle 枢纽正放/倒放 + thinking↔replying 直达），durationMs = 帧数/15fps
- [x] getTransitionPath：from===to 空序列；有直达 1 段；否则经 idle 枢纽 2 段；缺段返回空（crossfade 兜底）
- [x] 表驱动单测覆盖：优先级抢占、preWorking/prePermission 回退、reading tick 超时、done 边沿、缺段兜底

## 评论

- 2026-08-19：已随首轮实现落地（commit aba4b8f）。状态机为纯逻辑、与视觉设计基准无关；skin-preview 设计的 10 态与过渡编排同构，验收标准中的「设计 10 态」即 `.scratch/skin-preview/DESIGN.md` §6 角色动画所列 10 态，无偏差。
