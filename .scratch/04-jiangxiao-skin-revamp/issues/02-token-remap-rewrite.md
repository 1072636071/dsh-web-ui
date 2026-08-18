# 令牌与 remap 重写

**Status:** ready-for-agent

**Blocked by:** 无——可立即开始

**构建内容：** 以 jx DESIGN.md 为唯一基准重写皮肤样式模块的令牌层：`--jx-*` 规范令牌按暗（墨金卷轴）/浅（宣纸梅花）双值表逐条补齐，`--dsw-static-*` / `--dsw-alias-*` / `--dsw-specific-*` remap 到唐风色板，暗/亮走官方信号 body[data-ds-dark-theme]。用户视角：启用皮肤后深浅双主题完整、无色值缺失、对比度达标。

**验收标准：**

- [ ] DESIGN.md §2 令牌表每个令牌暗浅双值齐全，缺一即违规
- [ ] remap 原则落地：neutral/bluish→墨阶 surface，blue/deepseek→金族，green/red/amber→石绿/赭朱/藤黄，alias/specific 全部指向 --jx-*
- [ ] 皮肤作用域 body[data-dsh-jiangxiao]，浅色 = :not([data-ds-dark-theme])
- [ ] 组件层无颜色字面量、无主题选择器（L3 规则）
- [ ] 深浅两主题肉眼可验：深底浅字、WCAG AA 对比度
- [ ] 不用纯 #fff/#000；唯一渐变为 --jx-gold-foil 与氛围渐变

## 评论
