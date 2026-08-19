# 素材入仓 + demo 自洽

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** 46 个角色 webp（232MB）从素材源复制进皮肤包 assets/ 目录并纳入 git，作为纯开发源（ADR-0003）：pack 工具输入、demo 自洽、开发预览。npm 发布不含素材，运行时仍走 dsh-pet 导入链。用户视角：克隆仓库即可跑 demo 与打包工具，无需额外找素材。

**验收标准：**

- [x] 46 个 webp（10 循环态 + 36 过渡态）完整复制进皮肤包 assets/character/，进 git
- [x] 皮肤包 npm files 字段不含 assets（包体积不变）
- [x] demo/预览可用仓内相对路径加载素材（无 file:// 绝对引用）
- [x] 素材完整性可校验（数量 46、循环态命名 {state}.webp、过渡态 transition-<from>-<to>.webp）
- [x] 不违反仓库门禁（pnpm docs:check 等不受影响）

## 评论

- 2026-08-19：已随首轮实现落地（commit aba4b8f）。素材内容与设计基准无关，2026-08-19 设计基准切换（对齐 `.scratch/skin-preview/`）不影响本工单，验收标准维持原样。
