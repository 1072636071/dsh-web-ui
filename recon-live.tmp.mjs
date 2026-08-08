import { chromium } from 'playwright'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle', timeout: 20000 }).catch(e => console.log('goto:', e.message))
await page.waitForTimeout(3000)
console.log('URL:', page.url())
console.log('title:', await page.title())
console.log('body attr:', await page.locator('body').evaluate(el => Object.keys(el.dataset).join(',') || '(none)'))
console.log('panes:', await page.locator('[data-pane]').evaluateAll(els => els.map(e => e.getAttribute('data-pane'))))
console.log('root id 存在:', await page.locator('#root').count())
console.log('登录/会话表单存在:', await page.locator('input[type="password"], input[name*="key"], [class*="login"]').count())
// 真实会话界面元素
const conv = await page.locator('[data-pane="conversation"]').count()
console.log('conversation pane:', conv)
if (conv) {
  console.log('--- 结构摘要（脱敏） ---')
  const summary = await page.evaluate(() => {
    const panes = {}
    for (const p of document.querySelectorAll('[data-pane]')) {
      const walk = (el, depth) => {
        const info = { tag: el.tagName.toLowerCase() }
        const cls = (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 4) : []
        if (cls.length) info.cls = cls
        const attrs = {}
        for (const a of el.attributes) {
          if (a.name.startsWith('data-') && a.name !== 'data-pane') attrs[a.name] = a.value.length > 40 ? a.value.slice(0, 40) + '…' : a.value
        }
        if (Object.keys(attrs).length) info.attrs = attrs
        if (el.getAttribute('role')) info.role = el.getAttribute('role')
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          info.control = true
        }
        if (el.childElementCount === 0) info.leaf = true
        if (el.childElementCount > 0 && depth < 6 && el.childElementCount <= 12) {
          info.children = [...el.children].map(c => walk(c, depth + 1))
        } else if (el.childElementCount > 12) {
          info.children = [...el.children].slice(0, 12).map(c => walk(c, depth + 1))
          info.more = el.childElementCount - 12
        }
        return info
      }
      panes[p.getAttribute('data-pane')] = walk(p, 0)
    }
    return panes
  })
  console.log(JSON.stringify(summary, null, 1).slice(0, 6000))
}
await b.close()
