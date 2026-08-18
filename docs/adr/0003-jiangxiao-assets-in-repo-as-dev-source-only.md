# ADR-0003：jiangxiao 素材入仓仅作开发源，运行时走 dsh-pet 导入链

**状态**: Accepted
**日期**: 2026-08-18
**来源**: docs/memorial/002-jiangxiao-skin-revamp（ADR-0001）

## 背景

jiangxiao 皮肤全面改造（memorial 002）需角色动画素材 46 个 webp（232MB）。用户指示「各种素材直接放代码仓库」。但皮肤包架构约束（memorial 001 已查实）：skin-center 只服务 `lib/client.js`，无通用资产路由；232MB 无法 base64 内联；npm 包无法携带 232MB。

## 决策

素材复制进 `packages/skins/jiangxiao/assets/character/` 并纳入 git（+232MB），**仅作开发源**：pack.mjs 打包输入、demo 自洽、开发预览。运行时浮层素材唯一来源是 dsh-pet 导入链 `GET /pet/jiangxiao/<file>`；npm 发布 `files` 不含 assets，npm 用户走设置卡导入流程。

## 被否决的替代方案

1. **扩展 skin-center 加通用资产路由**（`/api/skin-center/asset/<id>/<file>`）— 本地开发可克隆即用，但改共享包影响面大，且 npm 用户与 git 用户素材来源不一致。
2. **jiangxiao 自建 host 半区注册资产路由** — 推翻 memorial 001 决策 5（不新建 host 半区），皮肤包形态变重。
3. **素材进 npm files** — 232MB npm 包不现实。

## 影响

- memorial 001 P2.2（打包工具输入源）闭环：仓内 `assets/`。
- 浮层必须有完整降级链（未导入不渲染 + 设置卡引导）。
- 仓库体积 +232MB，克隆变慢；接受。
