import { chromium } from 'playwright'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://127.0.0.1:3080/', { waitUntil: 'networkidle', timeout: 20000 })
await page.waitForTimeout(2000)
const r = await page.evaluate(() => {
  const conv = document.querySelector('[data-pane="conversation"]')
  // 粗略统计
  const stats = {}
  const count = (sel, k) => stats[k] = document.querySelectorAll(sel).length
  count('[data-pane="sidebar"] [role="treeitem"]', 'sidebarTreeItems')
  count('[data-pane="sidebar"] button', 'sidebarButtons')
  count('[data-pane="conversation"] textarea', 'textareas')
  count('[data-pane="conversation"] button', 'convButtons')
  count('[data-pane="conversation"] [class*="empty"], [data-pane="conversation"] [class*="welcome"]', 'emptyOrWelcome')
  stats.convText = (conv?.innerText || '').replace(/\s+/g, ' ').slice(0, 200)
  stats.sidebarText = (document.querySelector('[data-pane="sidebar"]')?.innerText || '').replace(/\s+/g, ' ').slice(0, 200)
  // 骨架体积预估：脱敏后的 #root HTML
  const root = document.getElementById('root')
  const clone = root.cloneNode(true)
  const walk = (el) => {
    for (const a of [...el.attributes]) {
      if (!['class', 'data-pane', 'data-dsh-frame', 'data-sidebar-collapsed', 'data-details-collapsed', 'data-dragging', 'role', 'aria-selected', 'aria-expanded', 'aria-checked', 'aria-current', 'aria-haspopup', 'aria-hidden', 'aria-disabled', 'type', 'disabled', 'tabindex', 'spellcheck', 'rows', 'cols', 'wrap'].includes(a.name)) el.removeAttribute(a.name)
    }
    for (const t of [...el.childNodes]) if (t.nodeType === 3) t.textContent = ''
    for (const c of [...el.children]) walk(c)
  }
  walk(clone)
  return { stats, skeletonBytes: clone.outerHTML.length }
})
console.log(JSON.stringify(r, null, 1).slice(0, 1500))
await b.close()
