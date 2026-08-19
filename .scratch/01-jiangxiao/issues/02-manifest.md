# webp 宠物 manifest 契约与 registry 扩展

**Status:** resolved

**Blocked by:** 无——可立即开始

**构建内容：** dsh-pet 后端能识别并解析 `kind: "animated-webp"` 新类型宠物定义（10 循环态 + 36 过渡态声明），host 服务把它与其他 spritesheet 宠物一起交给浏览器选择器，行为不破坏现有鲸鱼娘等契约。

**验收标准：**

- [ ] `PetManifest` 增加 `kind?: "spritesheet" | "animated-webp"`（缺省回退 spritesheet 契约，既有宠物零影响）
- [ ] webp 类型解析：`states`（10 循环态→文件）+ `transitions`（key `<from>→<to>`→文件+时长）声明校验通过后进入 `PetDefinition`
- [ ] 安全校验：非法 id/路径穿越/缺字段/未知 kind 均被拒并记 warning（沿用 `resolvePetManifest` 模式）
- [ ] host 端 `/api/pet/pets` 正确返回 webp 类型定义；资产路由按声明 serve 每个 webp 文件
- [ ] `registry.test.ts` 扩展：合法 webp manifest 解析、非法输入拒绝、spritesheet 兼容性回归全绿

**验收决策参考（来自 PRD D7/D13，勿偏离）：**

```ts
interface WebpPetAnimation {
  kind: 'animated-webp'
  states: Record<JiangxiaoState, string>   // 10 循环态 → 文件
  transitions: Record<string, { webp: string; durationMs: number }> // "<from>→<to>" → 文件+时长
}
```

- 过渡文件 36 个全打包，但渲染层过渡表只索引 pet 可达 10 态路径（D13）

## 评论

- 2026-08-19 核实：`registry.ts` 已含 `kind?: "spritesheet" | "animated-webp"`、`states` 10 循环态校验、`transitions` 编译校验、非法 id/路径穿越/未知 kind 拒收并记 warning，`/api/pet/pets` 返回 webp 定义且资产路由按声明 serve；`registry.test.ts` 覆盖 webp 解析/非法拒绝/spritesheet 回归。

（评论与对话历史追加于此，新内容置于最前。）
